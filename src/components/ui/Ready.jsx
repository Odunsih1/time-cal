import React from "react";
import Button from "./Buttons";

const Ready = () => {
  return (
    <section className="bg-blue-50 mt-16">
      <div className="xl:w-[900px] w-[100%] flex flex-col gap-7 text-center justify-center m-auto p-15">
        <h1 className="text-3xl font-bold">
          Ready to simplify your scheduling?
        </h1>
        <p className="text-xl text-gray-600">
          Join thousands of freelancers who have taken control of their calender
        </p>
        <Button
          className={
            "bg-blue-600 text-white p-3.5 rounded-lg cursor-pointer text-xl transition hover:bg-blue-500"
          }
          name={"Start For Free"}
        />
      </div>
    </section>
  );
};

export default Ready;
