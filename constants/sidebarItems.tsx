import {
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  SquareDashedKanban,
  SquareKanban,
  Wallet,
} from "lucide-react";

export const navItems = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard />,
    href: "/dashboard",
  },
  {
    label: "Managment",
    icon: <SquareKanban />,
    href: "/dashboard/todo",
  },
  {
    label: "Articles",
    icon: <Package />,
    children: [
      { label: "Products", href: "/dashboard/products" },
      { label: "Categories", href: "/dashboard/categories" },
      { label: "Lots", href: "/dashboard/lots" },
      { label: "Services", href: "/dashboard/services" },
    ],
  },
  {
    label: "Sell",
    icon: <ShoppingCart className="rotate-y-180" />,
    children: [
      { label: "Clients", href: "/dashboard/clients" },
      { label: "Transactions", href: "/dashboard/sell/transactions" },
      { label: "Proforma", href: "/dashboard/sell/proforma" },
      { label: "Payment", href: "/dashboard/sell/payment" },
      { label: "Return", href: "/dashboard/sell/return" },
    ],
  },
  {
    label: "Buy",
    icon: <ShoppingCart />,
    children: [
      { label: "Suppliers", href: "/dashboard/suppliers" },
      { label: "Transactions", href: "/dashboard/buy/transactions" },
      { label: "Payment", href: "/dashboard/buy/payment" },
      { label: "Return", href: "/dashboard/buy/return" },
    ],
  },
  {
    label: "Expenses",
    icon: <Wallet />,
    href: "/dashboard/expenses",
  },
];

export const accountItems = [
  {
    label: "Settings",
    icon: <Settings />,
    children: [
      { label: "Info", href: "/dashboard/info" },
      { label: "Users", href: "/dashboard/users" },
      { label: "Data" },
    ],
  },
  { label: "Log out", icon: <LogOut />, href: "/login" },
];
