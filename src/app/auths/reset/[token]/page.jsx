"use client";
import Buttons from "@/components/ui/Buttons";
import { Calendar, Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";

const ResetPasswordPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { token } = useParams();

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      await axios.post("/api/auth/reset-password", {
        token,
        password: formData.password,
      });
      toast.success("Password reset successful! Please sign in.");
      router.push("/auth");
    } catch (error) {
      console.error(
        "Reset password error:",
        error.response?.data?.error || error.message
      );
      toast.error(
        error.response?.data?.error?.includes("Invalid or expired token")
          ? "Invalid or expired reset link"
          : "Failed to reset password: " +
              (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      onContextMenu={handleContextMenu}
      className="min-h-screen bg-blue-50 flex justify-center items-center p-4 sm:p-6"
    >
      <Toaster position="top-right" reverseOrder={false} />
      <form
        onSubmit={handleSubmit}
        className="bg-white py-6 px-4 sm:px-8 md:px-10 shadow rounded-lg border w-full max-w-lg sm:max-w-md border-gray-300"
      >
        <div className="text-center flex flex-col gap-4 sm:gap-6 mb-6">
          <h1 className="flex justify-center text-xl sm:text-2xl gap-1.5 font-semibold">
            <Calendar className="text-blue-600 h-6 w-6" /> Time-Cal
          </h1>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold">
              Reset Password
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Enter your new password below
            </p>
          </div>
        </div>

        <label
          className="block text-sm sm:text-base font-medium text-gray-700"
          htmlFor="password"
        >
          New Password
        </label>
        <div className="relative">
          <input
            className="p-2 text-base sm:text-lg block w-full pr-10 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-500" />
            ) : (
              <Eye className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
        <div className="mt-4" />

        <label
          className="block text-sm sm:text-base font-medium text-gray-700"
          htmlFor="confirm-password"
        >
          Confirm New Password
        </label>
        <div className="relative">
          <input
            className="p-2 text-base sm:text-lg block w-full pr-10 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            type={showConfirmPassword ? "text" : "password"}
            id="confirm-password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={toggleConfirmPasswordVisibility}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5 text-gray-500" />
            ) : (
              <Eye className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
        <div className="mt-4" />

        <Buttons
          className="bg-blue-600 mt-3 p-2 text-white w-full rounded-md cursor-pointer transition hover:bg-blue-500 text-base sm:text-lg"
          name={loading ? "Loading..." : "Reset Password"}
          disabled={loading}
        />

        <p className="text-center mt-4 text-sm sm:text-base">
          Back to{" "}
          <button
            type="button"
            className="text-blue-600 transition hover:underline"
            onClick={() => router.push("/auths")}
            disabled={loading}
          >
            Sign in
          </button>
        </p>
      </form>
    </main>
  );
};

export default ResetPasswordPage;
