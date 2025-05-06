import React from "react";

const Button = ({ name, className, onClick }) => {
  return (
    <div>
      <button onClick={onClick} className={className}>
        {name}
      </button>
    </div>
  );
};

export default Button;
