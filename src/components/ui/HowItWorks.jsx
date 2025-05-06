import { Calendar, Clock, Mail } from "lucide-react";
import React from "react";

const HowItWorks = () => {
  return (
    <section>
      <div className="m-auto text-center items-center flex flex-col justify-center xl:w-[900px] w-[100%] ">
        <div>
          <h1 className="font-bold text-3xl mt-15">How It Works</h1>
        </div>
        <div className=" flex lg:flex-row flex-col gap-3">
          <div className="lg:max-w-[300px] w-full mt-10 shadow-md flex flex-col gap-4 shadow-gray-200 transition duration-500 hover:shadow-gray-500 p-7 rounded-lg">
            <div className="bg-blue-100 w-[33px] p-2 text-blue-600 rounded-full">
              <Calendar height={20} width={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-xl">Sync Your Calender</h3>
              <p className="text-lg text-gray-500">
                Connect with Google Calendar to display your real-time
                availability. No more double bookings.
              </p>
            </div>
          </div>
          <div className="lg:max-w-[300px] w-full mt-10 shadow-md flex flex-col gap-4  shadow-gray-200 transition duration-500 hover:shadow-gray-500 p-7 rounded-lg">
            <div className="bg-blue-100 w-[33px] p-2 text-blue-600 rounded-full">
              <Clock height={20} width={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-xl">Set Your Availability</h3>
              <p className="text-lg text-gray-500">
                Define when you're available for meetings. Only show the time
                slots that work for you.
              </p>
            </div>
          </div>
          <div className="lg:max-w-[300px] w-full mt-10 shadow-md flex flex-col gap-4 shadow-gray-200 transition duration-500 hover:shadow-gray-500 p-7 rounded-lg">
            <div className="bg-blue-100 w-[33px] p-2 text-blue-600 rounded-full">
              <Mail height={20} width={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-xl">Get Booked</h3>
              <p className="text-lg text-gray-500">
                Share your booking link with clients. They can book available
                slots and both parties receive confirmations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
