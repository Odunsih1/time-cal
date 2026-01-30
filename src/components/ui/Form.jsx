"use client";
import Buttons from "@/components/ui/Buttons";
import {
  Calendar,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
} from "lucide-react";
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

const Form = () => {
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
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    <form
      onSubmit={handleSubmit}
      className="bg-white py-8 px-6 sm:px-10 md:px-12 shadow-xl lg:shadow-none rounded-2xl border-2 lg:border-none border-slate-200 w-full max-w-lg sm:max-w-md hover:shadow-2xl lg:hover:shadow-none transition-shadow duration-300"
    >
      {/* Header */}
      <div className="text-center flex flex-col gap-6 mb-8">
        {/* Logo - Hidden on Desktop since it's on the left panel */}
        <div className="flex justify-center items-center gap-2 lg:hidden">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Calendar className="text-white h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Time-Cal
          </h1>
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {isForgotPassword
              ? "Reset Password"
              : isSignUp
              ? "Create Account"
              : "Welcome Back"}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            {isForgotPassword
              ? "Enter your email to receive a password reset link"
              : isSignUp
              ? "Fill in your details to get started"
              : "Enter your credentials to access your account"}
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        {isSignUp && !isForgotPassword && (
          <div>
            <label
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2"
              htmlFor="name"
            >
              <UserIcon className="w-4 h-4" />
              Full Name
            </label>
            <input
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-base"
              placeholder="Henry Odunsi"
              type="text"
              id="name"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>
        )}

        <div>
          <label
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2"
            htmlFor="email"
          >
            <Mail className="w-4 h-4" />
            Email
          </label>
          <input
            className={`w-full p-3 bg-slate-50 border ${
              emailError
                ? "border-red-500 ring-2 ring-red-200"
                : "border-slate-200"
            } rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-base`}
            placeholder="name@example.com"
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          {emailError && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-600 rounded-full"></span>
              {emailError}
            </p>
          )}
        </div>

        {!isForgotPassword && (
          <div>
            <label
              className="flex justify-between items-center text-sm font-semibold text-slate-700 mb-2"
              htmlFor="password"
            >
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </span>
              {!isSignUp && (
                <button
                  type="button"
                  className="text-blue-600 text-xs font-medium cursor-pointer hover:underline transition"
                  onClick={toggleForgotPassword}
                >
                  Forgot password?
                </button>
              )}
            </label>
            <div className="relative">
              <input
                className="w-full p-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-base"
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-4 hover:bg-slate-50 rounded-r-xl transition"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-slate-500" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-500" />
                )}
              </button>
            </div>
          </div>
        )}

        {isSignUp && !isForgotPassword && (
          <div>
            <label
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2"
              htmlFor="confirm-password"
            >
              <Lock className="w-4 h-4" />
              Confirm Password
            </label>
            <div className="relative">
              <input
                className="w-full p-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-base"
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-4 hover:bg-slate-50 rounded-r-xl transition"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-slate-500" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-500" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !!emailError}
        className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-semibold text-base transition-all hover:shadow-sm cursor-pointer hover:shadow-blue-600/20  active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
      >
        {loading ? (
          "Loading..."
        ) : (
          <>
            {isForgotPassword
              ? "Send Reset Link"
              : isSignUp
              ? "Create Account"
              : "Sign In"}
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {/* Divider & Social Login */}
      {!isForgotPassword && (
        <>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            className="w-full inline-flex justify-center items-center py-3.5 px-4 rounded-xl shadow-sm bg-white text-base font-medium cursor-pointer text-slate-700 hover:bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="h-5 w-5 mr-3"
            />
            Continue with Google
          </button>
        </>
      )}

      {/* Toggle Form */}
      <div className="mt-6 text-center">
        <p className="text-sm sm:text-base text-slate-600">
          {isForgotPassword
            ? "Back to sign in?"
            : isSignUp
            ? "Already have an account?"
            : "Don't have an account?"}{" "}
          <button
            type="button"
            className="text-blue-600 font-semibold cursor-pointer hover:underline transition"
            onClick={isForgotPassword ? toggleForgotPassword : toggleForm}
            disabled={loading}
          >
            {isForgotPassword ? "Sign in" : isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </form>
  );
};

export default Form;
