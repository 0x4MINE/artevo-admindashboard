"use client";
import Image from "next/image";
import React from "react";
import SidebarBtn from "../SidebarBtn";
import { BiMenu } from "react-icons/bi";
import { CgClose } from "react-icons/cg";
import { usePathname } from "next/navigation";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  Box,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingBag,
  User,
  Wallet,
} from "lucide-react";

function Sidebar() {
  const [open, setOpen] = React.useState(false);
  const pathName = usePathname();
  const items = [
    {
      to: "/dashboard",
      Icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      to: "/dashboard/clients",
      Icon: User,
      label: "Clients",
    },
    {
      to: "/dashboard/suppliers",
      Icon: Box,
      label: "Suppliers",
    },

    {
      to: "/dashboard/expenses",
      Icon: Wallet,
      label: "Expenses",
    },
    {
      to: "/dashboard/categories",
      Icon: Wallet,
      label: "Categories",
    },
    {
      to: "/dashboard/users",
      Icon: User,
      label: "Users",
    },
    {
      to: "/dashboard/products",
      Icon: ShoppingBag,
      label: "Products",
    },
    {
      to: "/dashboard/data",
      Icon: User,
      label: "Data",
    },
  ];
  function toggleOpen() {
    setOpen((prev) => !prev);
  }

  return (
    <>
      <div
        className="md:hidden p-4 fixed top-4 left-4 z-50 bg-white rounded-full  cursor-pointer"
        onClick={toggleOpen}
      >
        {!open ? <BiMenu size={24} /> : <CgClose size={24} />}
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/5 bg-opacity-40 z-40 md:hidden"
          onClick={toggleOpen}
        />
      )}

      <div
        className={`
          fixed top-0 left-0 h-screen w-64 p-6 z-50 scrollbar-
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:flex
              overflow-y-auto 

        `}
      >
        <div className="flex flex-col justify-between h-full w-full">
          <div>
            <Image
              className="hidden md:block mb-4"
              src="/logo.png"
              alt="logo"
              width={150}
              height={50}
            />

            {items.map((item, i) => {
              return (
                <SidebarBtn
                  key={i}
                  to={item.to}
                  label={item.label}
                  Icon={item.Icon}
                  isActive={pathName === item.to}
                />
              );
            })}
          </div>

          <div>
            <SidebarBtn to="/Expenses" label="Settings" Icon={Settings} />
            <SidebarBtn to="/login" label="Logout" Icon={LogOut} />
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
