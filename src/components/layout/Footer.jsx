import { Calendar } from "lucide-react";
import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="mt-10 w-full">
      <div className="xl:w-[900px] w-[100%] m-auto text-center items-center flex flex-col justify-center gap-6 p-7">
        <div className="flex xl:flex-row flex-col m-auto items-center gap-4 justify-between w-full">
          <h1 className="flex text-2xl gap-1.5 font-semibold">
            <Calendar className="text-blue-600" /> Time-Cal
          </h1>
          <ul className="flex gap-3.5 text-gray-600 ">
            <li className="transition hover:text-blue-500 cursor-pointer">
              About
            </li>
            <li className="transition hover:text-blue-500 cursor-pointer">
              Features
            </li>
            <li className="transition hover:text-blue-500 cursor-pointer">
              Pricing
            </li>
            <li className="transition hover:text-blue-500 cursor-pointer">
              Support
            </li>
            <li className="transition hover:text-blue-500 cursor-pointer">
              <Link href="/privacy">Privacy</Link>
            </li>
            <li className="transition hover:text-blue-500 cursor-pointer">
              <Link href="/terms">Terms</Link>
            </li>
          </ul>
        </div>
        <p className="text-gray-600">
          &copy; {new Date().getFullYear()} Time-Cal. All right reserved
        </p>
      </div>
    </footer>
  );
};

export default Footer;
