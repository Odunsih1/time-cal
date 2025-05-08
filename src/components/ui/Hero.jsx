"use client";
import Image from "next/image";
import React from "react";
import Buttons from "./Buttons";
import { useRouter } from "next/navigation";

const Hero = () => {
  const router = useRouter();
  return (
    <section className="bg-blue-50 py-25">
      <div className="xl:w-[900px] w-[100%] flex lg:flex-row flex-col justify-center m-auto p-10">
        <div className="lg:w-[50%] w-full flex flex-col gap-8">
          <h1 className="font-bold lg:text-5xl text-4xl ">
            Schedule meetings without the back-and-forth
          </h1>
          <p className="text-xl text-gray-600">
            TimeCanvas connects your calendar, shows your real-time
            availability, and lets clients book directly, eliminating scheduling
            confusion.
          </p>
          <div className="flex gap-5">
            <Buttons
              onClick={() => router.push("/auths")}
              className={
                "bg-blue-600 text-white p-3.5 rounded-lg cursor-pointer text-xl transition hover:bg-blue-500"
              }
              name={"Get Started"}
            />
            <Buttons
              className={
                "border-2 bg-white border-gray-200 p-3.5 rounded-lg cursor-pointer transition hover:bg-gray-100 text-xl"
              }
              name={"See it In Action"}
            />
          </div>
        </div>
        <div className="lg:w-[50%] w-full mt-10">
          <Image
            className="rounded-xl shadow-lg shadow-gray-400"
            width={700}
            height={500}
            src="/images/time.avif"
            alt="image"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
