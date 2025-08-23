import Link from "next/link";
import React from "react";

type Props = {
  text: string;
};

function Btn({ text }: Props) {
  return (
    <Link
      href={"/dashboard"}
      className=" text-center p-2 bg-btn-primary text-white  hover:bg-btn-secondary transition rounded-[10px] cursor-pointer"
    >
      {text}
    </Link>
  );
}

export default Btn;
