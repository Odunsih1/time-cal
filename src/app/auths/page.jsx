"use client";
import Buttons from "@/components/ui/Buttons";
import { Calendar, Eye, EyeOff } from "lucide-react";
import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

const Page = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [emailError, setEmailError] = useState(""); // New state for email validation
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Email regex for client-side validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    window.addEventListener("popstate", () => {});
    return () => window.removeEventListener("popstate", () => {});
  }, []);

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setFormData({ fullName: "", email: "", password: "", confirmPassword: "" });
    setProfilePic(null);
    setEmailError("");
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setIsSignUp(false);
    setFormData({ fullName: "", email: "", password: "", confirmPassword: "" });
    setEmailError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
    } else {
      setProfilePic(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate email on change
    if (name === "email") {
      if (!value) {
        setEmailError("Email is required");
      } else if (!emailRegex.test(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    }
  };

  const uploadProfilePic = async () => {
    if (!profilePic) return "";
    const formData = new FormData();
    formData.append("file", profilePic);
    try {
      const response = await axios.post("/api/upload", formData);
      return response.data.url;
    } catch (error) {
      console.error("Profile picture upload error:", error);
      throw new Error("Failed to upload profile picture");
    }
  };

  const setSessionCookie = async (idToken) => {
    try {
      await axios.post(
        "/api/auth/set-session",
        { idToken },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Set session cookie error:", error.message, error);
      throw new Error("Failed to set session cookie");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || emailError) return;
    setLoading(true);

    try {
      if (isForgotPassword) {
        if (!formData.email) {
          toast.error("Please enter your email");
          return;
        }
        await axios.post("/api/auth/forgot-password", {
          email: formData.email,
        });
        toast.success("Password reset link sent to your email!");
        setIsForgotPassword(false);
        setFormData({
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      } else if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }
        if (!emailRegex.test(formData.email)) {
          toast.error("Please enter a valid email address");
          return;
        }
        const profilePicUrl = await uploadProfilePic();
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const idToken = await userCredential.user.getIdToken();

        // Send email verification
        await sendEmailVerification(userCredential.user);

        const response = await axios.post("/api/auth/signup", {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          profilePicUrl,
        });
        await setSessionCookie(idToken);
        toast.success(
          "Sign-up successful! Please check your email to verify your account."
        );
        router.push("/dashboard");
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const idToken = await userCredential.user.getIdToken();
        const response = await axios.post("/api/auth/signin", {
          email: formData.email,
          idToken,
        });
        toast.success("Sign-in successful!");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error(
        "Authentication error:",
        error.response?.data?.error || error.message,
        error
      );
      toast.error(
        error.response?.data?.error?.includes("Email already in use")
          ? "Email already in use"
          : error.response?.data?.error?.includes("Missing required fields")
          ? "Please fill all required fields"
          : error.response?.data?.error?.includes("User not found")
          ? "No account found with this email"
          : "Authentication failed: " +
            (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      await setSessionCookie(idToken);
      const response = await axios.post("/api/auth/google", {
        idToken,
        fullName: result.user.displayName,
      });
      toast.success("Google sign-in successful!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Google sign-in error:", error.message, error);
      toast.error("Google sign-in failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-blue-50 flex justify-center items-center p-4 sm:p-6">
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
              {isForgotPassword
                ? "Reset Your Password"
                : isSignUp
                ? "Create an account"
                : "Welcome back"}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {isForgotPassword
                ? "Enter your email to receive a password reset link"
                : isSignUp
                ? "Fill in your details to get started"
                : "Enter your credentials to access your account"}
            </p>
          </div>
        </div>

        {isSignUp && !isForgotPassword && (
          <>
            <label
              className="block text-sm sm:text-base font-medium text-gray-700"
              htmlFor="name"
            >
              Full Name
            </label>
            <input
              className="p-2 text-base sm:text-lg block w-full pr-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Henry Odunsi"
              type="text"
              id="name"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
            <div className="mt-4" />
          </>
        )}

        <label
          className="block text-sm sm:text-base font-medium text-gray-700"
          htmlFor="email"
        >
          Email
        </label>
        <input
          className={`p-2 text-base sm:text-lg block w-full pr-3 py-2 border-2 ${
            emailError ? "border-red-500" : "border-gray-300"
          } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          placeholder="name@example.com"
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
        {emailError && (
          <p className="mt-1 text-sm text-red-600">{emailError}</p>
        )}
        <div className="mt-4" />

        {!isForgotPassword && (
          <>
            <label
              className="flex justify-between text-sm sm:text-base font-medium text-gray-700"
              htmlFor="password"
            >
              Password
              {!isSignUp && (
                <button
                  type="button"
                  className="text-blue-600 transition hover:underline"
                  onClick={toggleForgotPassword}
                >
                  Forgot password?
                </button>
              )}
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
          </>
        )}

        {isSignUp && !isForgotPassword && (
          <>
            <label
              className="block text-sm sm:text-base font-medium text-gray-700"
              htmlFor="confirm-password"
            >
              Confirm Password
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
            <label
              className="block text-sm sm:text-base font-medium text-gray-700"
              htmlFor="profile-pic"
            >
              Profile Picture (Optional)
            </label>
            <div className="relative">
              <input
                className="p-2 text-base sm:text-lg block w-full border-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 file:cursor-pointer hover:file:bg-blue-100"
                type="file"
                id="profile-pic"
                accept="image/*"
                onChange={handleProfilePicChange}
              />
            </div>
            {profilePic && (
              <div className="mt-3 flex justify-center">
                <img
                  src={URL.createObjectURL(profilePic)}
                  alt="Profile Preview"
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover"
                />
              </div>
            )}
            <div className="mt-4" />
          </>
        )}

        <Buttons
          className="bg-blue-600 mt-3 p-2 text-white w-full rounded-md cursor-pointer transition hover:bg-blue-500 text-base sm:text-lg"
          name={
            loading
              ? "Loading..."
              : isForgotPassword
              ? "Send Reset Link"
              : isSignUp
              ? "Sign up"
              : "Sign in"
          }
          disabled={loading || !!emailError}
        />

        {!isForgotPassword && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="w-full cursor-pointer inline-flex justify-center items-center py-2 px-4 rounded-md shadow-sm bg-white text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="h-5 w-5 mr-2"
                />
                Google
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="text-center mt-4 text-sm sm:text-base">
            {isForgotPassword
              ? "Back to sign in?"
              : isSignUp
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              type="button"
              className="text-blue-600 transition hover:underline"
              onClick={isForgotPassword ? toggleForgotPassword : toggleForm}
              disabled={loading}
            >
              {isForgotPassword ? "Sign in" : isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </form>
    </main>
  );
};

export default Page;
