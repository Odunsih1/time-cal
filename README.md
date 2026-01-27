# Time-Cal

**Time-Cal** is a SaaS platform designed for professionals to seamlessly manage schedules, bookings, and client interactions. It features Google Calendar integration, custom availability settings, and automated notifications.

## Features

- **Profile & Availability**: customized profiles and 5-day availability scheduling.
- **Google Calendar Sync**: Two-way synchronization for bookings.
- **Public Booking System**: Shareable unique links for clients to book appointments without authentication.
- **Notifications**: Automated email (Nodemailer) and real-time browser notifications.
- **Secure Authentication**: Powered by Firebase (Email/Password & Google Sign-In).

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, MongoDB (via Mongoose)
- **Services**: Firebase Auth, Google Calendar API, Cloudinary, Nodemailer

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (Local or Atlas)
- Accounts for: Firebase, Google Cloud, Cloudinary, and an SMTP provider (e.g., Gmail).

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Odunsih1/time-cal.git
   cd time-cal
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file with the following keys:

   ```env
   # Firebase
   FIREBASE_API_KEY=...
   FIREBASE_AUTH_DOMAIN=...
   FIREBASE_PROJECT_ID=...
   FIREBASE_STORAGE_BUCKET=...
   FIREBASE_MESSAGING_SENDER_ID=...
   FIREBASE_APP_ID=...

   # Firebase Admin
   FIREBASE_ADMIN_PROJECT_ID=...
   FIREBASE_ADMIN_PRIVATE_KEY=...
   FIREBASE_ADMIN_CLIENT_EMAIL=...

   # MongoDB
   MONGODB_URI=...

   # Google Calendar
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
   NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=...

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...

   # Nodemailer
   EMAIL_HOST=...
   EMAIL_PORT=...
   EMAIL_USER=...
   EMAIL_PASS=...
   EMAIL_FROM=...

   # App
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```

## License

This project is licensed under the MIT License.
For support, contact [henryodunsi@gmail.com](mailto:henryodunsi@gmail.com).
