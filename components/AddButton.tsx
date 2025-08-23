import React from "react";

type Props = {
  text?: string;
  onClick?: () => void;
  type?: "submit" | "reset" | "button" | undefined;
};

function AddButton({ text = "+ ADD", onClick, type }: Props) {
  return (
    <button
      onClick={onClick}
      type={type}
      className="py-2 px-4 bg-btn-primary hover:bg-btn-secondary transition cursor-pointer text-white rounded-[10px] "
    >
      {text}
    </button>
  );
}

export default AddButton;
