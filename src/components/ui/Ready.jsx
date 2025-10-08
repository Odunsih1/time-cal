"use client";
import React from "react";
import Buttons from "./Buttons";
import { useRouter } from "next/navigation";

const Ready = () => {
  const router = useRouter();
  return (
    <section className="bg-blue-50 mt-16">
      <div className="xl:w-[900px] w-[100%] flex flex-col gap-7 text-center justify-center m-auto p-15">
        <h1 className="text-3xl font-bold">
          Ready to simplify your scheduling?
        </h1>
        <p className="text-xl text-gray-600">
          Join thousands of freelancers who have taken control of their calender
        </p>
        <Buttons
          onClick={() => router.push("/auths")}
          className={
            "bg-blue-600 inline-flex items-center gap-2  text-white cursor-pointer px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 "
          }
          name={"Get Started for Free"}
        />
      </div>
    </section>
  );
};

export default Ready;
