"use client";

import React from "react";
import toast, { Toaster } from "react-hot-toast";
import Form from "@/components/ui/Form";
import { Calendar, CheckCircle } from "lucide-react";

const Auth = () => {
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  return (
    <main
      onContextMenu={handleContextMenu}
      className="min-h-screen flex bg-white"
    >
      <Toaster position="top-right" reverseOrder={false} />

      {/* Left Side - Branding/Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 -left-10 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-0 -right-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-blue-500/30 to-transparent"></div>
        </div>

        {/* Logo/Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
            <Calendar className="text-white h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Time-Cal</span>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Simplify your scheduling today.
          </h1>
          <p className="text-lg text-blue-100 mb-8 leading-relaxed">
            Join thousands of professionals who trust Time-Cal to manage their
            appointments, streamline bookings, and reclaim their time.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-blue-50">
              <div className="w-6 h-6 rounded-full bg-blue-500/50 flex items-center justify-center border border-blue-400/30">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="font-medium">Automated booking management</span>
            </div>
            <div className="flex items-center gap-3 text-blue-50">
              <div className="w-6 h-6 rounded-full bg-blue-500/50 flex items-center justify-center border border-blue-400/30">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="font-medium">Calendar synchronization</span>
            </div>
            <div className="flex items-center gap-3 text-blue-50">
              <div className="w-6 h-6 rounded-full bg-blue-500/50 flex items-center justify-center border border-blue-400/30">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="font-medium">Seamless client notifications</span>
            </div>
          </div>
        </div>

        {/* Footer/Copyright */}
        <div className="relative z-10 text-sm text-blue-200 flex justify-between items-center">
          <p>© {new Date().getFullYear()} Time-Cal Inc.</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">
              Privacy
            </span>
            <span className="hover:text-white cursor-pointer transition-colors">
              Terms
            </span>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-slate-50 lg:bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <Form />
        </div>
      </div>
    </main>
  );
};

export default Auth;
