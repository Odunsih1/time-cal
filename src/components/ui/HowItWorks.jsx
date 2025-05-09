"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Mail } from "lucide-react";
import React from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  hover: {
    y: -5,
    scale: 1.02,
    transition: {
      duration: 0.2,
    },
  },
};

const HowItWorks = () => {
  return (
    <section className="py-16">
      <div className="m-auto text-center items-center flex flex-col justify-center xl:w-[900px] w-[100%]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h1 className="font-bold text-3xl mb-4">How It Works</h1>
          <p className="text-gray-500 mb-12">Simple steps to get started</p>
        </motion.div>

        <motion.div
          className="flex lg:flex-row w-[95%] flex-col gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div
            className="lg:max-w-[300px] w-full mt-10 shadow-md flex flex-col gap-4 shadow-gray-200 p-7 rounded-lg bg-white"
            variants={itemVariants}
            whileHover="hover"
          >
            <motion.div
              className="bg-blue-100 w-[33px] p-2 text-blue-600 rounded-full"
              whileHover={{ rotate: 10 }}
            >
              <Calendar height={20} width={20} />
            </motion.div>
            <div className="text-left">
              <h3 className="font-bold text-xl mb-2">Sync Your Calendar</h3>
              <p className="text-gray-500">
                Connect with Google Calendar to display your real-time
                availability. No more double bookings.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="lg:max-w-[300px] w-full mt-10 shadow-md flex flex-col gap-4 shadow-gray-200 p-7 rounded-lg bg-white"
            variants={itemVariants}
            whileHover="hover"
            transition={{ delay: 0.1 }}
          >
            <motion.div
              className="bg-blue-100 w-[33px] p-2 text-blue-600 rounded-full"
              whileHover={{ rotate: 10 }}
            >
              <Clock height={20} width={20} />
            </motion.div>
            <div className="text-left">
              <h3 className="font-bold text-xl mb-2">Set Your Availability</h3>
              <p className="text-gray-500">
                Define when you're available for meetings. Only show the time
                slots that work for you.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="lg:max-w-[300px] w-full mt-10 shadow-md flex flex-col gap-4 shadow-gray-200 p-7 rounded-lg bg-white"
            variants={itemVariants}
            whileHover="hover"
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="bg-blue-100 w-[33px] p-2 text-blue-600 rounded-full"
              whileHover={{ rotate: 10 }}
            >
              <Mail height={20} width={20} />
            </motion.div>
            <div className="text-left">
              <h3 className="font-bold text-xl mb-2">Get Booked</h3>
              <p className="text-gray-500">
                Share your booking link with clients. They can book available
                slots and both parties receive confirmations.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
