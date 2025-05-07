import React from "react";

const Buttons = ({ name, className, onClick }) => {
  return (
    <div>
      <button onClick={onClick} className={className}>
        {name}
      </button>
    </div>
  );
};

export default Buttons;
