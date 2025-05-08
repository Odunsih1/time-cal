"use client";
import Header from "@/components/layout/Header";
import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import TabSection from "@/components/ui/TabSection";

const ProfilePage = () => {
  return (
    <>
      <Header />
      <main className="bg-gray-100 min-h-screen pt-20">
        <Toaster position="top-right" reverseOrder={false} />
        <div className="bg-white border border-gray-200 rounded-lg lg:w-[700px] m-auto w-[95%] p-10">
          <div>
            <h1 className="font-bold text-2xl">Profile Settings</h1>
            <p className="text-gray-600 text-md">
              Update your profile information and availability settings
            </p>
          </div>
          <TabSection />
        </div>
      </main>
    </>
  );
};

export default ProfilePage;
