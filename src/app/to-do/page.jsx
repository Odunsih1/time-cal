"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
} from "firebase/firestore";
import axios from "axios";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { Calendar, Tag, Clock, Trash2 } from "lucide-react";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/DatePicker";
import { Toaster, toast } from "react-hot-toast";
import Loader from "@/components/ui/Loader";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";

const TodoPage = () => {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [calendarView, setCalendarView] = useState(false);
  const [calendarFilter, setCalendarFilter] = useState("day");
  const [selectedDate, setSelectedDate] = useState(null);
  const [filter, setFilter] = useState("all");
  const [emailSettings, setEmailSettings] = useState({
    dailyDigest: true,
    upcomingTasks: true,
    overdueReminders: true,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async (currentUser) => {
      try {
        setLoading(true);
        const idToken = await currentUser.getIdToken(true);
        const profileResponse = await axios.get("/api/profile", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const userData = profileResponse.data.user;
        setEmailSettings(userData.emailSettings || emailSettings);
      } catch (error) {
        console.error("Fetch email settings error:", error);
        toast.error("Failed to load email settings");
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchData(currentUser);
        const tasksQuery = query(
          collection(db, `users/${currentUser.uid}/tasks`)
        );
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
          const tasksData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setTasks(tasksData);
        });
        return () => unsubscribeTasks();
      } else {
        router.push("/auth");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const addTask = async () => {
    if (!newTask.trim() || !dueDate) {
      toast.error("Task name and due date are required");
      return;
    }

    try {
      await addDoc(collection(db, `users/${user.uid}/tasks`), {
        name: newTask,
        dueDate: dueDate.toISOString(),
        status: "pending",
        priority: "medium",
        tags: [],
        reminder: "1 hour before",
        createdAt: new Date().toISOString(),
      });
      setNewTask("");
      setDueDate(null);
      toast.success("Task added successfully!");
    } catch (error) {
      console.error("Add task error:", error);
      toast.error("Failed to add task");
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      await updateDoc(doc(db, `users/${user.uid}/tasks`, taskId), updates);
      toast.success("Task updated successfully!");
    } catch (error) {
      console.error("Update task error:", error);
      toast.error("Failed to update task");
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, `users/${user.uid}/tasks`, taskId));
      toast.success("Task deleted successfully!");
    } catch (error) {
      console.error("Delete task error:", error);
      toast.error("Failed to delete task");
    }
  };

  const toggleEmailSetting = async (key, value) => {
    setEmailSettings((prev) => ({ ...prev, [key]: value }));
    try {
      const idToken = await auth.currentUser.getIdToken();
      await axios.post(
        "/api/profile",
        { emailSettings: { ...emailSettings, [key]: value } },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      toast.success("Email settings updated!");
    } catch (error) {
      console.error("Update email settings error:", error);
      toast.error("Failed to update email settings");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const getCalendarTasks = () => {
    if (!selectedDate) return [];
    let start, end;
    if (calendarFilter === "day") {
      start = startOfDay(selectedDate);
      end = endOfDay(selectedDate);
    } else if (calendarFilter === "week") {
      start = startOfWeek(selectedDate);
      end = endOfWeek(selectedDate);
    } else {
      start = startOfMonth(selectedDate);
      end = endOfMonth(selectedDate);
    }
    return tasks.filter((task) => {
      const taskDate = new Date(task.dueDate);
      return taskDate >= start && taskDate <= end;
    });
  };

  const calendarTasks = getCalendarTasks();

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Toaster />
      <Header />
      <main className="bg-gray-100 min-h-screen p-4 pt-20">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h2 className="text-2xl font-bold">To-Do</h2>
              <Toggle
                pressed={calendarView}
                onPressedChange={setCalendarView}
                className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar View
              </Toggle>
            </div>
            {!calendarView ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <DatePicker selected={dueDate} onSelect={setDueDate} />
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a new task"
                    className="flex-1"
                  />
                  <Button
                    onClick={addTask}
                    className="bg-blue-600 hover:bg-blue-500"
                  >
                    <span className="text-xl">+</span>
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Calendar View</CardTitle>
                  <p className="text-gray-600">View tasks by date</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <Button
                      variant={calendarFilter === "day" ? "default" : "outline"}
                      onClick={() => setCalendarFilter("day")}
                    >
                      Day
                    </Button>
                    <Button
                      variant={
                        calendarFilter === "week" ? "default" : "outline"
                      }
                      onClick={() => setCalendarFilter("week")}
                    >
                      Week
                    </Button>
                    <Button
                      variant={
                        calendarFilter === "month" ? "default" : "outline"
                      }
                      onClick={() => setCalendarFilter("month")}
                    >
                      Month
                    </Button>
                  </div>
                  <ShadcnCalendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                  {selectedDate && (
                    <div className="mt-4">
                      <h4 className="text-lg font-semibold">
                        Tasks for{" "}
                        {calendarFilter === "day"
                          ? format(selectedDate, "PPP")
                          : `${calendarFilter} view`}
                      </h4>
                      {calendarTasks.length === 0 ? (
                        <p>No tasks for this {calendarFilter}.</p>
                      ) : (
                        <TaskList
                          tasks={calendarTasks}
                          updateTask={updateTask}
                          deleteTask={deleteTask}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {!calendarView && (
            <div className="mb-6">
              <Tabs defaultValue="all" onValueChange={setFilter}>
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="mt-4">
                <AnimatePresence>
                  {filteredTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      updateTask={updateTask}
                      deleteTask={deleteTask}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Email Reminders</CardTitle>
              <p className="text-gray-600">
                Configure how you receive task notifications
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold">Daily Digest</h4>
                    <p className="text-gray-600">
                      Receive a summary of your tasks each day
                    </p>
                  </div>
                  <Toggle
                    pressed={emailSettings.dailyDigest}
                    onPressedChange={(value) =>
                      toggleEmailSetting("dailyDigest", value)
                    }
                    className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold">Upcoming Tasks</h4>
                    <p className="text-gray-600">
                      Get notified about tasks coming soon
                    </p>
                  </div>
                  <Toggle
                    pressed={emailSettings.upcomingTasks}
                    onPressedChange={(value) =>
                      toggleEmailSetting("upcomingTasks", value)
                    }
                    className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold">Overdue Reminders</h4>
                    <p className="text-gray-600">
                      Get reminded about tasks you haven't completed
                    </p>
                  </div>
                  <Toggle
                    pressed={emailSettings.overdueReminders}
                    onPressedChange={(value) =>
                      toggleEmailSetting("overdueReminders", value)
                    }
                    className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                  />
                </div>
              </div>
              <footer className="mt-6 text-gray-600 text-sm">
                To connect your email for reminders, please set up your account
                in profile settings.
              </footer>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

// TaskItem Component
const TaskItem = ({ task, updateTask, deleteTask }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const priorityColors = {
    high: "border-red-500",
    medium: "border-yellow-500",
    low: "border-green-500",
  };

  const statusOptions = ["pending", "in_progress", "completed"];
  const priorityOptions = ["low", "medium", "high"];
  const tagOptions = ["work", "personal", "health", "finance", "other"];
  const reminderOptions = [
    "30 mins before",
    "1 hour before",
    "1 day before",
    "1 week before",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`border-l-4 ${
        priorityColors[task.priority]
      } bg-white p-4 mb-2 rounded-md shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between relative`}
    >
      <div className="flex items-start gap-2 w-full sm:w-auto">
        <input
          type="checkbox"
          checked={task.status === "completed"}
          onChange={() =>
            updateTask(task.id, {
              status: task.status === "completed" ? "pending" : "completed",
            })
          }
          className="mt-1"
        />
        <div className="flex-1">
          <h4
            className={`font-semibold ${
              task.status === "completed" ? "line-through" : ""
            }`}
          >
            {task.name}
          </h4>
          <div className="flex flex-wrap gap-2 mt-1">
            {task.tags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-200 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2 sm:mt-0 w-full sm:w-auto justify-between">
        <span className="text-gray-600 text-sm">
          {format(new Date(task.dueDate), "PPP")}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1"
        >
          <span className="text-xl">
            <div className="flex gap-1">
              <div className="border-2 border-gray-600 rounded-full" />
              <div className="border-2 border-gray-600 rounded-full" />
              <div className="border-2 border-gray-600 rounded-full" />
            </div>
          </span>
        </Button>
      </div>
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute right-0 top-12 bg-white border rounded-md shadow-lg p-4 z-10 w-full sm:w-64"
        >
          <div className="mb-2">
            <label className="block text-sm font-semibold">Status</label>
            <select
              value={task.status}
              onChange={(e) => updateTask(task.id, { status: e.target.value })}
              className="w-full p-1 border rounded"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() +
                    status.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label className="block text-sm font-semibold">Priority</label>
            <select
              value={task.priority}
              onChange={(e) =>
                updateTask(task.id, { priority: e.target.value })
              }
              className="w-full p-1 border rounded"
            >
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label className="block text-sm font-semibold">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => (
                <label key={tag} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={task.tags.includes(tag)}
                    onChange={() => {
                      const newTags = task.tags.includes(tag)
                        ? task.tags.filter((t) => t !== tag)
                        : [...task.tags, tag];
                      updateTask(task.id, { tags: newTags });
                    }}
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>
          <div className="mb-2">
            <label className="block text-sm font-semibold">Reminder</label>
            <select
              value={task.reminder}
              onChange={(e) =>
                updateTask(task.id, { reminder: e.target.value })
              }
              className="w-full p-1 border rounded"
            >
              {reminderOptions.map((reminder) => (
                <option key={reminder} value={reminder}>
                  {reminder}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              deleteTask(task.id);
              setIsMenuOpen(false);
            }}
            className="w-full bg-red-600 hover:bg-red-500"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

// TaskList Component
const TaskList = ({ tasks, updateTask, deleteTask }) => (
  <div>
    <AnimatePresence>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          updateTask={updateTask}
          deleteTask={deleteTask}
        />
      ))}
    </AnimatePresence>
  </div>
);

export default TodoPage;
