"use client";

import React from "react";
import toast, { Toaster } from "react-hot-toast";
import Form from "@/components/ui/Form";

const Auth = () => {
  const handleContextMenu = (e) => {
    e.preventDefault();
  };
  return (
    <main
      onContextMenu={handleContextMenu}
      className="min-h-screen bg-blue-50 flex justify-center items-center p-4 sm:p-6"
    >
      <Toaster position="top-right" reverseOrder={false} />
      <Form />
    </main>
  );
};

export default Auth;
