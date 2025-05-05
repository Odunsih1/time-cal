import React from "react";
import Button from "../ui/Button";
import { Calendar, User } from "lucide-react";

const Header = () => {
  return (
    <nav className="bg-white border-b-2 border-gray-200">
      <div className="flex justify-between p-3.5">
        <div className="p-3.5">
          <h1 className="flex gap-2.5 text-2xl font-bold cursor-pointer">
            <span>
              <Calendar className="text-blue-500" />
            </span>
            Time-Cal
          </h1>
        </div>
        <div className="flex gap-10">
          <ul className="flex gap-5">
            <li className="flex p-3.5 rounded-lg cursor-pointer transition hover:bg-gray-100 text-xl gap-2">
              {" "}
              <Calendar /> Dashboard
            </li>
            <li className="flex p-3.5 rounded-lg cursor-pointer transition hover:bg-gray-100 text-xl gap-2">
              {" "}
              <User /> Profile
            </li>
          </ul>
          <Button
            className={
              "border-2 border-gray-200 p-3.5 rounded-lg cursor-pointer transition hover:bg-gray-100 text-xl"
            }
            name={"Sign Out"}
          />
        </div>
      </div>
    </nav>
  );
};

export default Header;
