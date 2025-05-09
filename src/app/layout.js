import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Time-Cal | Scheduling & Availability Tool",
  description:
    "Time-Cal is a Software as a Service (SaaS) platform designed for professionals to manage their schedules, bookings, and client interactions seamlessly. Hosted in the cloud, Time-Cal allows users to set custom availability, integrate with Google Calendar, share public booking links, and receive notifications—all accessible via a web browser. With a multi-tenant architecture, secure authentication, and scalable infrastructure, Time-Cal is ideal for freelancers, consultants, and small businesses.",
  keywords: [
    "Time-Cal",
    "freelancer scheduler",
    "freelancer booking app",
    "SaaS scheduling platform",
    "online appointment booking",
    "Google Calendar sync",
    "client scheduling software",
    "consultant availability tool",
    "small business scheduling",
    "multi-tenant SaaS app",
    "secure booking software",
    "web-based calendar tool",
    "remote work scheduling",
    "cloud scheduling app",
    "professional time management",
    "calendar sharing tool",
    "booking system for freelancers",
    "time management for consultants",
    "scheduling software for solopreneurs",
    "custom availability scheduling",
    "automated appointment notifications",
    "booking platform for small businesses",
  ],
  icons: {
    icon: "/images/time-cal-logo.png",
  },
  metadataBase: new URL("https://time-cal.vercel.app"),
  openGraph: {
    title: "Time-Cal | Freelancer Scheduling & Availability Tool",
    description:
      "Share your availability, sync calendars, and let clients book time — with Time-Cal.",
    url: "https://time-cal.vercel.app/",
    siteName: "Time-Cal",
    images: [
      {
        url: "/images/time-cal-logo.png",
        width: 800,
        height: 600,
        alt: "Time-Cal logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Time-Cal | Scheduling & Availability Tool",
    description:
      "Share your availability, sync calendars, and let clients book time — with Time-Cal.",
    images: ["/images/time-cal-logo.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
