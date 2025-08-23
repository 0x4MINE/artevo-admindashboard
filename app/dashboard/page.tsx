"use client";

import DashboardCard from "@/components/dashboard/DashboardCard";
import DashboardLineChart from "@/components/dashboard/DashboardLineChart";
import DashboardPieChart from "@/components/dashboard/DashboardPieChart";
import StatCard from "@/components/dashboard/StatCard";
import CustomTable from "@/components/custom-table";
import { Column } from "@/types/Column";
import { Box, ShoppingBag, User, Webhook } from "lucide-react";
import { motion } from "framer-motion";
import useSWR from "swr";
import { toast, Toaster } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

export default function Page() {
  const { data, error, isLoading } = useSWR("/api/dashboard", fetcher, {
    revalidateOnFocus: false, 
    dedupingInterval: 10000,  
  });

  if (error) {
    console.log(error)
    toast.error("Failed to load dashboard data");
  }

  const customColumns: Column[] = [
    { key: "rank", label: "Rank", type: "text" },
    { key: "name", label: "Name", type: "text" },
    { key: "spent", label: "Spent", type: "currency" },
  ];

  return (
    <div className="bg-background min-h-screen p-4">
      <Toaster richColors/>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <DashboardCard label="Clients" amount={data?.cards?.clients ?? "..."} Icon={User} />
          <DashboardCard label="Suppliers" amount={data?.cards?.suppliers ?? "..."} Icon={Box} />
          <DashboardCard label="Product" amount={data?.cards?.products ?? "..."} Icon={ShoppingBag} />
          <DashboardCard label="Services" amount={data?.cards?.services ?? "..."} Icon={Webhook} />
        </div>

        {/* Charts */}
        <div className="my-8">
          <h2 className="text-3xl font-bold text-title">Stats</h2>
          <div className="lg:grid grid-cols-5 gap-3">
            <div className="col-span-3 my-3">
              <DashboardLineChart />
            </div>
            <div className="col-span-2 my-3">
              <DashboardPieChart />
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="my-8 grid md:grid-cols-1 lg:grid-cols-2 gap-3">
          <StatCard values={data?.stats?.profit ?? {}} title="Profit" />
          <StatCard values={data?.stats?.expenses ?? {}} title="Expenses" />
          <StatCard values={data?.stats?.sell ?? {}} title="Sell" />
          <StatCard values={data?.stats?.buy ?? {}} title="Buy" />
        </div>

        {/* Top Clients */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold my-2 text-title">Top Clients</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <CustomTable
              title="Overall"
              className="w-full"
              columns={customColumns}
              showActions={false}
              data={data?.topClients ?? []}
            />
            <CustomTable
              title="This month"
              className="w-full"
              columns={customColumns}
              showActions={false}
              data={data?.topClients ?? []}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
