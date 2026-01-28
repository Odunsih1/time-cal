"use client";
import React, { useState, useEffect } from "react";
import { Calendar, User, Menu, X, LogOut, Home, Settings } from "lucide-react";
import { auth } from "@/lib/firebaseConfig";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Toaster, toast } from "react-hot-toast";

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      if (!user) {
        if (window.location.pathname !== "/") {
          router.push("/");
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      toast.success("Signed out successfully!");
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out: " + error.message);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path) => pathname === path;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Calendar },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <>
      <nav
        onContextMenu={handleContextMenu}
        className="bg-white border-b-2 border-slate-200 fixed w-full z-50 shadow-sm"
      >
        <Toaster position="top-center" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href={isAuthenticated ? "/dashboard" : "/"}>
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Time-Cal
                </span>
              </div>
            </Link>

            {/* Desktop Menu */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link key={link.href} href={link.href}>
                      <div
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                          active
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{link.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Desktop Action Button */}
            <div className="hidden md:block">
              {isAuthenticated ? (
                <Button
                  onClick={handleSignOut}
                  className="bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border-2 border-slate-200 hover:border-red-200 px-5 py-2.5 rounded-xl cursor-pointer font-semibold transition-all flex items-center gap-2  active:translate-y-0"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                <Button
                  onClick={() => router.push("/auths")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 cursor-pointer rounded-xl font-semibold transition-all hover:shadow-sm hover:shadow-blue-600/20 flex items-center gap-2 active:translate-y-0"
                >
                  Get Started
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6 text-slate-700" />
                ) : (
                  <Menu className="h-6 w-6 text-slate-700" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t-2 border-slate-200 py-4 bg-slate-50">
              <div className="flex flex-col gap-2">
                {isAuthenticated &&
                  navLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    return (
                      <Link key={link.href} href={link.href}>
                        <div
                          onClick={toggleMenu}
                          className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl font-semibold transition-all ${
                            active
                              ? "bg-blue-600 text-white shadow-md"
                              : "text-slate-700 hover:bg-white"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{link.label}</span>
                        </div>
                      </Link>
                    );
                  })}

                <div className="px-2 mt-2">
                  {isAuthenticated ? (
                    <Button
                      onClick={() => {
                        handleSignOut();
                        toggleMenu();
                      }}
                      className="w-full bg-slate-100 hover:bg-red-50 text-slate-700 cursor-pointer hover:text-red-700 border-2 border-slate-200 hover:border-red-200 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        router.push("/auths");
                        toggleMenu();
                      }}
                      className="w-full bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      Get Started
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden under fixed header */}
      <div className="h-20"></div>
    </>
  );
};

export default Header;
