"use client"

import {
  Calendar,
  Home,
  Inbox,
  LucideProps,
  Search,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";

type TLink = {
  title: string;
  url: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  children?: TLink;
};

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Clients",
    url: "/dashboard/clients",
    icon: Inbox,
    children: [
      {
        title: "All Clients",
        url: "/dashboard/clients/all",
      },
      {
        title: "Add New",
        url: "/dashboard/clients/new",
      },
    ],
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

import { ForwardRefExoticComponent, RefAttributes, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function AppSidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Image src={"/logo.png"} alt="logo" width={200} height={90} />
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-8">
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname.startsWith(item.url);
                const hasChildren =
                  Array.isArray(item.children) && item.children.length > 0;
                const isOpen = openMenus[item.title];

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      onClick={() => hasChildren && toggleMenu(item.title)}
                    >
                      {hasChildren ? (
                        <button className="flex items-center gap-2 w-full text-left">
                          <item.icon />
                          <span>{item.title}</span>
                        </button>
                      ) : (
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>

                    {/* Submenu */}
                    {hasChildren && isOpen && (
                      <div className="ml-6 mt-2 space-y-1">
                        {item.children?.map((child) => {
                          const isChildActive = pathname === child.url;
                          return (
                            <Link
                              key={child.title}
                              href={child.url}
                              className={`block text-sm px-2 py-1 rounded hover:bg-muted transition ${
                                isChildActive
                                  ? "bg-muted text-primary"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {child.title}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
