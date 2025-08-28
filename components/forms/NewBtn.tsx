import React from "react";

type Props = {
  onClick: React.MouseEventHandler<HTMLButtonElement> | undefined;
  text: string;
};

function NewBtn({ onClick, text }: Props) {
  return (
    <button
      onClick={onClick}
      className="py-2 px-4 bg-btn-primary text-white rounded-[10px] cursor-pointer font-bold flex items-center justify-center gap-3"
    >
      <span className="font-bold text-2xl">+</span> {text}
    </button>
  );
}

export default NewBtn;
