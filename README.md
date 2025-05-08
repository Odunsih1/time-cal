###### Time-Cal

Time-Cal is a scheduling and booking application that allows users to manage appointments, sync with Google Calendar, upload profile images via Cloudinary, and send email notifications using Nodemailer. Built with Next.js, Firebase Authentication, MongoDB, and Google Calendar API, Time-Cal provides a seamless experience for professionals to organize their schedules and for clients to book appointments effortlessly.
Features
User Authentication:
Sign up/sign in with email/password or Google Sign-In via Firebase.

Secure session management with Firebase session cookies.

## Google Calendar Integration:

Connect and disconnect Google Calendar to sync bookings.

Automatically sync new and updated bookings to Google Calendar.

## Image Upload:

Upload and manage profile pictures using Cloudinary.

## Email Notifications:

Send email notifications for bookings, cancellations, and reminders using Nodemailer.

## Dashboard:

View and manage upcoming and completed bookings.

Set custom availability for the next 5 days.

Enable/disable email and browser notifications.

Copy a public booking link to share with clients.

## Public Booking:

Clients can book appointments via a public link (/book/[userId]) without authentication.

## Responsive UI:

Built with Tailwind CSS and shadcn/ui components.

Smooth loading animations with a calendar-themed loader.

## Notifications:

Toast notifications for actions (e.g., booking updates, Google Calendar sync) using react-hot-toast.

## Tech Stack

1. Frontend: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui

2. Backend: Next.js API Routes, MongoDB (via Mongoose)

3. Authentication: Firebase Authentication (email/password, Google Sign-In)

4. APIs: Google Calendar API (via googleapis)

5. Image Storage: Cloudinary

6. Email: Nodemailer

7. Database: MongoDB

8. Deployment: Vercel

9. Other Libraries:
   axios for HTTP requests

react-hot-toast for notifications

lucide-react for icons

date-fns for date handling

cloudinary for image uploads

nodemailer for email notifications

Prerequisites
Before setting up Time-Cal, ensure you have the following installed:
Node.js: v18 or higher

npm: v9 or higher

MongoDB: Local instance or MongoDB Atlas

Firebase Account: For authentication

Google Cloud Project: For Google Calendar API

Cloudinary Account: For image storage

Email Service: Gmail or another SMTP provider for Nodemailer

Vercel Account: For deployment (optional)

Setup Instructions

1. Clone the Repository
   bash

git clone https://github.com/Odunsih1/time-cal.githttps://github.com/your-username/time-cal.git
cd time-cal

2. Install Dependencies
   bash

npm install

3. Configure Environment Variables
   Create a .env.local file in the root directory and add the following:
   env

# Firebase Configuration (from Firebase Console > Project Settings)

FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
FIREBASE_APP_ID=your-firebase-app-id

# Firebase Admin SDK (from Firebase Console > Service Accounts)

FIREBASE_ADMIN_PROJECT_ID=your-firebase-project-id
FIREBASE_ADMIN_PRIVATE_KEY=your-firebase-private-key
FIREBASE_ADMIN_CLIENT_EMAIL=your-firebase-client-email

# MongoDB Connection (local or MongoDB Atlas)

MONGODB_URI=mongodb://localhost:27017/time-cal

# Google Calendar API (from Google Cloud Console > APIs & Services > Credentials)

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary (from Cloudinary Dashboard > Account Details)

CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Nodemailer (e.g., Gmail SMTP)

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=your-email@gmail.com

# Next.js (optional, for production)

NEXTAUTH_URL=https://time-cal.vercel.app

Notes:
Replace placeholders with actual values.

For Google OAuth, set the redirect URI to https://time-cal.vercel.app/api/auth/callback (or http://localhost:3000/api/auth/callback for local development) in Google Cloud Console.

For Nodemailer with Gmail, generate an App Password in your Google Account settings if 2FA is enabled.

Ensure Cloudinary credentials are copied from the Cloudinary Dashboard.

4. Set Up Firebase
   Go to Firebase Console.

Create a new project or use an existing one.

Enable Email/Password and Google sign-in providers in Authentication > Sign-in method.

Generate a Firebase Admin SDK private key in Project Settings > Service Accounts and add it to .env.local.

5. Set Up Google Calendar API
   Go to Google Cloud Console.

Create a new project or use an existing one.

Enable the Google Calendar API in APIs & Services > Library.

Create an OAuth 2.0 Client ID in Credentials:
Application type: Web application

Authorized redirect URIs: https://time-cal.vercel.app/api/auth/callback (or http://localhost:3000/api/auth/callback for local development)

Copy the Client ID and Client Secret to .env.local.

6. Set Up Cloudinary
   Sign up or log in to Cloudinary.

Go to Dashboard to find your Cloud Name, API Key, and API Secret.

Add these to .env.local.

(Optional) Create a preset for unsigned uploads if used in the app.

7. Set Up Nodemailer
   For Gmail:
   Enable 2FA on your Google Account.

Generate an App Password at myaccount.google.com > Security > 2-Step Verification > App passwords.

Use the App Password as EMAIL_PASS in .env.local.

For other SMTP providers, update EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS accordingly.

8. Set Up MongoDB
   Install MongoDB locally or use MongoDB Atlas.

Create a database named time-cal.

Update MONGODB_URI in .env.local with your connection string.

9. Run the Application
   bash

npm run dev

Open http://localhost:3000 in your browser. 10. Build for Production
bash

npm run build
npm run start

Usage
For Users

1. Sign Up / Sign In
   Navigate to /auth to create an account with email/password or sign in with Google.

After signing in, you’ll be redirected to the dashboard (/dashboard).

2. Upload Profile Picture
   In the dashboard, upload a profile picture under the Profile section.

Images are stored securely on Cloudinary and displayed in the dashboard.

3. Connect Google Calendar
   Click Connect Google Calendar under the Profile section.

Authorize Time-Cal to access your Google Calendar.

The button will change to “Google Calendar Connected” upon success.

4. Sync Bookings
   Click Sync Google Calendar to synchronize bookings between Time-Cal and Google Calendar.

New or updated bookings will appear in your Google Calendar.

5. Disconnect Google Calendar
   Click Disconnect Google Calendar to remove Time-Cal’s access to your calendar.

To fully revoke access:
Go to myaccount.google.com > Security > Your connections to third-party apps & services.

Find Time-Cal and click Remove Access.

This clears server-side tokens and prevents further calendar access.

6. Manage Bookings
   In the Your Calendar section, switch to the Bookings tab to view all bookings.

For upcoming bookings, click Mark Completed or Cancel to update their status.

Receive email notifications (via Nodemailer) for new bookings, cancellations, or reminders if enabled.

View Quick Stats for counts of upcoming and completed bookings.

7. Set Custom Availability
   In the Your Calendar section, select a date (up to 5 days from today).

Choose start and end times, then click Save Custom Availability.

Clients can book within these time slots via your public booking link.

8. Share Public Booking Link
   In the Your Booking Link section, copy the link (e.g., https://time-cal.vercel.app/book/<userId>).

Share it with clients to allow them to book appointments without signing in.

9. Configure Notifications
   In the Notifications section, toggle email or browser notifications for new bookings, cancellations, or reminders.

Email notifications are sent via Nodemailer to the address specified in your profile.

10. Sign Out
    Click Sign Out in the header to log out and return to the homepage (/).

For Clients
Visit the public booking link (e.g., https://time-cal.vercel.app/book/<userId>).

Select a date and time within the user’s availability.

Enter your name, email, and message, then submit to create a booking.

Receive a confirmation email (via Nodemailer) if configured.

The booking will appear in the user’s dashboard and Google Calendar (if synced).

API Endpoints
Key API endpoints include:
POST /api/auth/signup: Create a new user with email/password.

POST /api/auth/signin: Sign in with email/password.

POST /api/auth/google: Sign in with Google (Firebase idToken).

GET /api/auth/google?action=login: Generate Google Calendar OAuth URL.

GET /api/auth/callback: Handle Google Calendar OAuth callback and save tokens.

POST /api/calendar/sync: Sync bookings with Google Calendar.

POST /api/calendar/disconnect: Disconnect Google Calendar by clearing tokens.

GET /api/profile: Fetch user profile data (including profile picture URL).

POST /api/profile/update: Update user settings (e.g., notifications, availability, profile picture).

GET /api/bookings: Fetch user bookings.

POST /api/bookings: Create a public booking.

POST /api/bookings/update: Update booking status (e.g., completed, cancelled).

Project Structure

time-cal/
├── src/
│ ├── app/
│ │ ├── api/ # API routes
│ │ ├── auth/ # Authentication pages
│ │ ├── book/[userId]/ # Public booking page
│ │ ├── dashboard/ # User dashboard
│ │ └── layout.js # Root layout
│ ├── components/
│ │ ├── layout/ # Header and other layouts
│ │ ├── ui/ # shadcn/ui components (Button, Card, etc.)
│ │ └── Loader.jsx # Loading animation
│ ├── lib/
│ │ ├── firebaseConfig.js # Firebase client config
│ │ ├── firebaseAdmin.js # Firebase Admin SDK config
│ │ ├── mongoose.js # MongoDB connection
│ │ └── cloudinary.js # Cloudinary config (optional)
│ ├── models/
│ │ └── User.js # Mongoose User schema
│ └── styles/ # Tailwind CSS
├── public/ # Static assets (e.g., default images)
├── .env.local # Environment variables
├── package.json # Dependencies and scripts
└── README.md # This file

Deployment
Deploy to Vercel
Push the repository to GitHub.

Import the repository into Vercel.

Add environment variables in Vercel’s dashboard (same as .env.local).

Deploy the app and access it at https://your-vercel-app.vercel.app.

Notes
Ensure NEXTAUTH_URL is set to your Vercel URL in production.

Update the Google OAuth redirect URI in Google Cloud Console to match the Vercel URL.

Verify Cloudinary and Nodemailer configurations work in production.

Troubleshooting
Build Errors
Module not found: Can't resolve 'net':
Ensure no client-side code imports googleapis. Check with:
bash

grep -r "googleapis" src

Delete node_modules and package-lock.json, then reinstall:
bash

rm -rf node_modules package-lock.json
npm install

Authentication Errors
“There is no user record corresponding to the provided identifier”:
Clear browser cookies or sign in again.

Verify Firebase user exists in Firebase Console > Authentication.

Check MongoDB:
bash

mongosh
use time-cal
db.users.find({ email: "test@example.com" })

Share logs from /api/auth/signup, /api/auth/google, /api/auth/callback, /api/calendar/sync.

Google Calendar Issues
OAuth redirect fails:
Verify GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and redirect URI in .env.local.

Test the OAuth URL logged by /api/auth/google.

Sync fails:
Check /api/calendar/sync logs for errors (e.g., invalid tokens).

Reconnect Google Calendar via /dashboard.

Cloudinary Issues
Image upload fails:
Verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.

Check Cloudinary Dashboard for upload logs.

Ensure the upload preset (if used) is configured correctly.

Nodemailer Issues
Email not sending:
Verify EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS.

For Gmail, ensure the App Password is correct and 2FA is enabled.

Test SMTP connection:
javascript

const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
host: process.env.EMAIL_HOST,
port: process.env.EMAIL_PORT,
auth: {
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASS,
},
});
transporter.verify((error, success) => {
if (error) console.error(error);
else console.log("SMTP connection successful");
});

Redirect Issues
Redirects to /auths instead of /auth or /:
Search for incorrect redirects:
bash

grep -r "window.location.href = \"/auths\"" src

Ensure Header.jsx and Dashboard.jsx redirect to / for unauthenticated users.

Contributing
Contributions are welcome! To contribute:
Fork the repository.

Create a feature branch:
bash

git checkout -b feature/your-feature

Commit your changes:
bash

git commit -m "Add your feature"

Push to the branch:
bash

git push origin feature/your-feature

Open a pull request.

Please include tests and update documentation as needed.
License
This project is licensed under the MIT License. See the LICENSE file for details.
Contact
For questions or support, contact henryodunsi@gmail.com (mailto:henryodunsi@gmail.com) or open an issue on GitHub.
