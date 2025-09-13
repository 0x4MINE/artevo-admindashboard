"use client";
import clsx from "clsx";
import React, { useState } from "react";
import { motion } from "framer-motion";

type Props = {
  values: Record<string, string | number>;
  title: string;
};

function StatCard({ values, title }: Props) {
  const [activeTab, setActiveTab] = useState("today");

  const tabs: { label: string; key: keyof typeof values }[] = [
    { label: "Today", key: "today" },
    { label: "This Week", key: "week" },
    { label: "This Month", key: "month" },
    { label: "This Year", key: "year" },
    { label: "Overall", key: "overall" },
  ];

  return (
    <div className="my-1">
      <h2 className="text-3xl font-bold mb-2 text-title">{title}</h2>
      <div className="bg-primary rounded-2xl border border-secondary p-6 mx-auto">
        <div className="tabs flex justify-evenly bg-[#F5F5F5] dark:bg-secondary rounded-2xl">
          {tabs.map(({ label, key }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={clsx(
                "text-xs font-semibold rounded-2xl px-2 py-2 w-full cursor-pointer",
                activeTab === key
                  ? "text-white bg-btn-primary"
                  : "text-[#B0B0B0]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="text-center mt-4">
          <motion.div
            key={activeTab}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ease: "easeOut", duration: 0.4 }}
            className="text-4xl font-bold text-title"
          >
            {values[activeTab] ?? 0}
          </motion.div>
          <div className="text-sm text-subtitle uppercase tracking-wide">
            DA
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatCard;
