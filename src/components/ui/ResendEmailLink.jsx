import React from "react";
import { Button } from "./Button";

const ResendEmailLink = ({ onClick }) => {
  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-md mx-auto max-w-7xl mb-6 flex flex-col md:flex-row justify-between items-center">
      <p>
        Your email is not verified. Please check your inbox for a verification
        link.
      </p>
      <Button
        onClick={onClick}
        className="bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
      >
        Resend Verification Email
      </Button>
    </div>
  );
};

export default ResendEmailLink;
