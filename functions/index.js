const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Daily Digest (8 AM daily)
exports.dailyDigest = functions.pubsub
  .schedule("0 8 * * *")
  .onRun(async (context) => {
    const db = admin.firestore();
    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const user = userDoc.data();
      if (!user.emailSettings?.dailyDigest) continue;

      const tasksSnapshot = await db
        .collection(`users/${userDoc.id}/tasks`)
        .where("status", "!=", "completed")
        .get();
      const tasks = tasksSnapshot.docs.map((doc) => doc.data());

      if (tasks.length === 0) continue;

      const msg = {
        to: user.email,
        from: "henryodunsi05@gmail.com", // Verified sender email
        subject: "Your Daily Task Digest",
        html: `
        <h2>Your Tasks for Today</h2>
        <ul>
          ${tasks
            .map(
              (task) =>
                `<li>${task.name} (Due: ${new Date(
                  task.dueDate
                ).toLocaleDateString()})</li>`
            )
            .join("")}
        </ul>
      `,
      };
      await sgMail.send(msg);
    }
  });

// Task Reminders (every minute)
exports.taskReminders = functions.pubsub
  .schedule("* * * * *")
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const user = userDoc.data();
      if (
        !user.emailSettings?.upcomingTasks &&
        !user.emailSettings?.overdueReminders
      )
        continue;

      const tasksSnapshot = await db
        .collection(`users/${userDoc.id}/tasks`)
        .get();
      for (const taskDoc of tasksSnapshot.docs) {
        const task = taskDoc.data();
        if (task.status === "completed") continue;

        const dueDate = new Date(task.dueDate);
        let reminderTime;
        switch (task.reminder) {
          case "30 mins before":
            reminderTime = new Date(dueDate.getTime() - 30 * 60 * 1000);
            break;
          case "1 hour before":
            reminderTime = new Date(dueDate.getTime() - 60 * 60 * 1000);
            break;
          case "1 day before":
            reminderTime = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
            break;
          case "1 week before":
            reminderTime = new Date(
              dueDate.getTime() - 7 * 24 * 60 * 60 * 1000
            );
            break;
          default:
            continue;
        }

        if (
          now >= reminderTime &&
          now < new Date(reminderTime.getTime() + 60 * 1000) &&
          user.emailSettings.upcomingTasks
        ) {
          const msg = {
            to: user.email,
            from: "henryodunsi05@gmail.com", // Verified sender email
            subject: `Reminder: ${task.name}`,
            html: `<p>Your task "${
              task.name
            }" is due on ${dueDate.toLocaleDateString()}.</p>`,
          };
          await sgMail.send(msg);
        }

        if (
          now > dueDate &&
          user.emailSettings.overdueReminders &&
          !task.notifiedOverdue
        ) {
          const msg = {
            to: user.email,
            from: "henryodunsi05@gmail.com", // Verified sender email
            subject: `Overdue: ${task.name}`,
            html: `<p>Your task "${
              task.name
            }" was due on ${dueDate.toLocaleDateString()} and is overdue.</p>`,
          };
          await sgMail.send(msg);
          await taskDoc.ref.update({ notifiedOverdue: true });
        }
      }
    }
  });
