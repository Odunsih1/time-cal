"use client";
import Image from "next/image";
import React from "react";
import Buttons from "./Buttons";
import { useRouter } from "next/navigation";

const Hero = () => {
  const router = useRouter();
  return (
    <section className="bg-white min-h-screen flex items-center relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-slate-50">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(203 213 225 / 0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 lg:px-8 py-20 lg:py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Content Side */}
          <div className="flex flex-col gap-8 lg:gap-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium w-fit">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Smart Scheduling Platform
            </div>

            {/* Heading */}
            <h1 className="font-bold text-4xl lg:text-6xl xl:text-6xl leading-tight text-slate-900">
              Schedule meetings{" "}
              <span className="relative inline-block">
                <span className="relative z-10">without</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-blue-200 -rotate-1"></span>
              </span>{" "}
              the back-and-forth
            </h1>

            {/* Description */}
            <p className="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-xl">
              Time-Cal connects your calendar, shows your real-time availability,
              and lets clients book directly, eliminating scheduling confusion.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Buttons
                onClick={() => router.push("/auths")}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl cursor-pointer text-lg font-semibold transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0"
                name="Get Started Free"
              />
              <Buttons
                className="border-2 bg-white border-slate-200 px-8 py-4 rounded-xl cursor-pointer transition-all hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-lg font-semibold text-slate-700"
                name="See it In Action"
              />
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-8 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-semibold text-slate-600"
                  >
                    {i}K
                  </div>
                ))}
              </div>
              <div className="text-sm text-slate-600">
                <p className="font-semibold text-slate-900">10,000+ users</p>
                <p>trusted by professionals</p>
              </div>
            </div>
          </div>

          {/* Image Side */}
          <div className="relative lg:mt-0 mt-8">
            {/* Decorative elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-600 rounded-3xl opacity-10 -z-10"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-slate-900 rounded-3xl opacity-5 -z-10"></div>
            
            {/* Main image container */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600 rounded-2xl rotate-3 opacity-10"></div>
              <Image
                className="rounded-2xl shadow-2xl shadow-slate-900/10 relative z-10 ring-1 ring-slate-900/5"
                width={700}
                height={500}
                src="/images/time.avif"
                alt="Time-Cal scheduling interface preview"
                priority
              />
              
              {/* Floating card elements */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg ring-1 ring-slate-900/5 hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Meeting Booked</p>
                    <p className="text-xs text-slate-500">2 minutes ago</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-6 -right-6 bg-blue-600 text-white p-4 rounded-xl shadow-lg hidden lg:block">
                <p className="text-xs font-medium opacity-90">Available Now</p>
                <p className="text-2xl font-bold">24/7</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;