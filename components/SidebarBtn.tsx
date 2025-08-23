import type {
  ForwardRefExoticComponent,
  JSX,
  ReactElement,
  ReactNode,
  RefAttributes,
} from "react";

import clsx from "clsx";
import React from "react";
import { IconType } from "react-icons";
import { FaUser } from "react-icons/fa";
import Link from "next/link";
import { LucideProps } from "lucide-react";

type Props = {
  isActive?: boolean;
  to: string;
  Icon: React.ComponentType<LucideProps>;
  label: string;
};

function SidebarBtn({ isActive, label, to, Icon }: Props) {
  return (
    <Link
      href={to}
      className={clsx(
        "hover:bg-[#DFEFFF] hover:text-[#2A6DB1] rounded-2xl w-full p-4 cursor-pointer my-2 flex items-center gap-4 ",
        isActive ? "text-[#2A6DB1] bg-[#DFEFFF]" : "text-[#B0B0B0]"
      )}
    >
      <Icon /> {/* Add JSX syntax to instantiate the component */}
      <h1>{label}</h1>
    </Link>
  );
}

export default SidebarBtn;