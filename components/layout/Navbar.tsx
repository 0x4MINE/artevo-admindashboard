"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { Menu, Moon, Sun } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import { useTheme } from "next-themes";
import ThemeToggle from "../ThemeToggle";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useSidebarStore } from "@/lib/store/useSidebar";
export default function Navbar() {
  const toggleSidebar = useSidebarStore((s) => s.toggle);

  const path = usePathname();

  const handlePageTitle = (): string => {
    const pageTitle = path.includes("lots")
      ? "Lots"
      : path
          .split("/")
          .at(-1)
          ?.replace(/^./, (c) => c.toUpperCase());

    return pageTitle ?? "";
  };
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex items-center px-8 "
    >
      <Menu className="md:hidden cursor-pointer" onClick={toggleSidebar} />
      <header className="flex w-full items-center justify-center  px-4 py-6   ">
        <h1 className="text-3xl font-bold text-title">{handlePageTitle()}</h1>
      </header>
    </motion.div>
  );
}
