"use client";

import { use, useActionState, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  Settings,
  LogOut,
  Sun,
  ChevronDown,
  Moon,
} from "lucide-react";
import { Switch } from "./ui/switch";
import ThemeToggle from "./ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebarStore } from "@/lib/store/useSidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { accountItems, navItems } from "@/constants/sidebarItems";
import clsx from "clsx";
import { logout } from "@/lib/actions/authActions";
import { useUserStore } from "@/lib/store/useUser";
import { useTheme } from "next-themes";

export default function Sidebar({ currentUser }: { currentUser: any }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openAccountMenu, setOpenAccountMenu] = useState<string | null>(null);
  const { isOpen, close } = useSidebarStore();
  const pathname = usePathname();
  const [state, logoutAction] = useActionState(logout, undefined);
  const { theme, setTheme } = useTheme();

  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    setUser(currentUser);
  }, [currentUser, setUser]);

  const toggleMenu = (label: string) => {
    setOpenMenu((prev) => (prev === label ? null : label));
  };

  const toggleAccountMenu = (label: string) => {
    setOpenAccountMenu((prev) => (prev === label ? null : label));
  };

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard" || href === "/dashboard/") {
      return pathname === "/dashboard" || pathname === "/dashboard/";
    }

    if (href.startsWith("/dashboard/")) {
      return pathname === href || pathname.startsWith(href + "/");
    }

    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(href + "/");
  };

  const isChildActive = (children?: { href?: string }[]) => {
    return children?.some((child) => child.href && isActiveRoute(child.href));
  };

  const isParentActive = (item: any) => {
    if (item.href && isActiveRoute(item.href)) {
      return true;
    }
    return isChildActive(item.children);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key={"blur"}
            onClick={close}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`
          fixed md:relative z-50
          h-full w-66 flex flex-col justify-between
          bg-background p-6 transition-transform duration-300 md:transition-none
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 md:opacity-100 md:!flex
          overflow-auto
        `}
      >
        {/* Brand */}
        <div className="mb-6">
          <div className="text-2xl font-bold">Artrevo</div>
          <div className="text-sm text-title/70">
            Advertising & Design Agency
          </div>

          {/* Overview */}
          <div className="mt-4 border-secondary">
            <div className="text-xs text-gray-400 py-2">OVERVIEW</div>
            {navItems.map((item) => (
              <div key={item.label} className="my-1 rounded-[8px]">
                {item.href ? (
                  <Link href={item.href}>
                    <div
                      className={clsx(
                        "flex items-center justify-between p-3 rounded cursor-pointer transition-all duration-200",
                        isParentActive(item)
                          ? "bg-primary text-title"
                          : "hover:bg-primary hover:text-title hover:scale-105"
                      )}
                      onClick={close}
                    >
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div
                    className={clsx(
                      "flex items-center justify-between hover:scale-105 gap-2 p-3 rounded cursor-pointer transition-all duration-200",
                      isParentActive(item)
                        ? "bg-primary text-title"
                        : "hover:bg-primary hover:text-title "
                    )}
                    onClick={() => item.children && toggleMenu(item.label)}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.children && (
                      <motion.div
                        animate={{
                          rotate: openMenu === item.label ? 180 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown size={18} />
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Submenu */}
                <AnimatePresence>
                  {item.children && openMenu === item.label && (
                    <motion.div
                      key="dropdown"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="ml-8 mt-2 flex flex-col gap-1 text-sm text-title overflow-hidden"
                    >
                      {item.children.map((sub) =>
                        sub.href ? (
                          <Link key={sub.label} href={sub.href}>
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 }}
                              className={clsx(
                                "p-2 rounded cursor-pointer font-medium transition-all duration-200",
                                isActiveRoute(sub.href)
                                  ? "bg-primary text-title font-bold "
                                  : "hover:bg-primary"
                              )}
                              onClick={close}
                            >
                              {sub.label}
                            </motion.div>
                          </Link>
                        ) : (
                          <motion.div
                            key={sub.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 }}
                            className="p-2 rounded text-muted-foreground"
                          >
                            {sub.label}
                          </motion.div>
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Account */}
        <div>
          <div className="text-xs text-gray-400 mb-2">ACCOUNT</div>
          <div className="flex items-center gap-4 px-2 my-1 ">
            <div className="w-8 h-8 rounded-full bg-secondary flex justify-center items-center text-title">
              {(currentUser.name[0] as string).toUpperCase()}
            </div>
            <p>{currentUser.name}</p>
          </div>

          {accountItems.map((item) => (
            <div key={item.label} className="my-1 rounded-[8px]">
              {item.href ? (
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className={clsx(
                      "flex items-center justify-between w-full p-3 rounded cursor-pointer transition-all duration-200",
                      isParentActive(item)
                        ? "bg-primary text-title"
                        : "hover:bg-primary hover:text-title hover:scale-105"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  </button>
                </form>
              ) : (
                <div
                  className={clsx(
                    "flex items-center justify-between hover:scale-105 gap-2 p-3 rounded cursor-pointer transition-all duration-200",
                    isParentActive(item)
                      ? "bg-primary text-title"
                      : "hover:bg-primary hover:text-title"
                  )}
                  onClick={() => item.children && toggleAccountMenu(item.label)}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.children && (
                    <motion.div
                      animate={{
                        rotate: openAccountMenu === item.label ? 180 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown size={18} />
                    </motion.div>
                  )}
                </div>
              )}

              {/* Account Submenu */}
              <AnimatePresence>
                {item.children && openAccountMenu === item.label && (
                  <motion.div
                    key="account-dropdown"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="ml-8 mt-2 flex flex-col gap-1 text-sm text-title overflow-hidden"
                  >
                    {item.children.map((sub) =>
                      sub.href ? (
                        <Link key={sub.label} href={sub.href}>
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 }}
                            className={clsx(
                              "p-2 rounded cursor-pointer font-medium transition-all duration-200",
                              isActiveRoute(sub.href)
                                ? "bg-primary text-title font-bold"
                                : "hover:bg-primary"
                            )}
                            onClick={close}
                          >
                            {sub.label}
                          </motion.div>
                        </Link>
                      ) : (
                        <motion.div
                          key={sub.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 }}
                          className="p-2 rounded text-muted-foreground"
                        >
                          {sub.label}
                        </motion.div>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Dark Mode Toggle */}
          <div className="flex items-center  gap-2 mt-4 px-2">
            <Sun />
            <Switch
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="data-[state=checked]:bg-subtitle data-[state=unchecked]:bg-subtitle "
            />
            <Moon />
          </div>
        </div>
      </motion.div>
    </>
  );
}
