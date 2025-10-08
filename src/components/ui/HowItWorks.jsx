"use client";
import { motion } from "framer-motion";
import { Calendar, Clock, Mail, ArrowRight } from "lucide-react";
import React from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const HowItWorks = () => {
  const steps = [
    {
      icon: Calendar,
      number: "01",
      title: "Sync Your Calendar",
      description:
        "Connect with Google Calendar to display your real-time availability. No more double bookings.",
      color: "blue",
    },
    {
      icon: Clock,
      number: "02",
      title: "Set Your Availability",
      description:
        "Define when you're available for meetings. Only show the time slots that work for you.",
      color: "violet",
    },
    {
      icon: Mail,
      number: "03",
      title: "Get Booked",
      description:
        "Share your booking link with clients. They can book available slots and both parties receive confirmations.",
      color: "emerald",
    },
  ];

  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      icon: "bg-blue-600",
      text: "text-blue-600",
      hover: "group-hover:bg-blue-600",
      ring: "ring-blue-600/10",
    },
    violet: {
      bg: "bg-violet-50",
      icon: "bg-violet-600",
      text: "text-violet-600",
      hover: "group-hover:bg-violet-600",
      ring: "ring-violet-600/10",
    },
    emerald: {
      bg: "bg-emerald-50",
      icon: "bg-emerald-600",
      text: "text-emerald-600",
      hover: "group-hover:bg-emerald-600",
      ring: "ring-emerald-600/10",
    },
  };

  return (
    <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-50 rounded-full blur-3xl opacity-30"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-2xl mx-auto mb-16 lg:mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
            Three Simple Steps
          </div>
          <h2 className="font-bold text-4xl lg:text-5xl mb-4 text-slate-900">
            How It Works
          </h2>
          <p className="text-lg lg:text-xl text-slate-600">
            Get started in minutes with our simple three-step process
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          className="grid lg:grid-cols-3 gap-8 lg:gap-6 relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {/* Connecting lines - desktop only */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-slate-200 -z-10">
            <motion.div
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              transition={{ duration: 1.5, delay: 0.5 }}
              viewport={{ once: true }}
            ></motion.div>
          </div>

          {steps.map((step, index) => {
            const colors = colorClasses[step.color];
            const Icon = step.icon;

            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative"
              >
                <div className="bg-white border-2 border-slate-100 rounded-2xl p-8 lg:p-10 h-full flex flex-col transition-all duration-300 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-1">
                  {/* Step number badge */}
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className={`relative w-16 h-16 ${colors.icon} rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                    >
                      <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-5xl font-bold text-slate-100 group-hover:text-slate-200 transition-colors">
                      {step.number}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-bold text-2xl mb-3 text-slate-900">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed mb-6">
                      {step.description}
                    </p>
                  </div>

                  {/* Action indicator */}
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 group-hover:text-slate-900 transition-colors">
                    <span>Step {index + 1}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>

                  {/* Hover decoration */}
                  <div
                    className={`absolute -top-1 -right-1 w-20 h-20 ${colors.bg} rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-2xl`}
                  ></div>
                </div>

                {/* Mobile connecting arrow */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-4">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.2 }}
                      viewport={{ once: true }}
                    >
                      <ArrowRight className="w-6 h-6 text-slate-300 rotate-90" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16 lg:mt-20"
        >
          <p className="text-slate-600 mb-6 text-lg">
            Ready to streamline your scheduling?
          </p>
          <button className="inline-flex items-center gap-2 bg-slate-900 text-white cursor-pointer px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0">
            Get Started for Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div> */}
      </div>
    </section>
  );
};

export default HowItWorks;