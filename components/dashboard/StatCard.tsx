"use client";
import clsx from "clsx";
import React, { useState } from "react";
import { motion } from "framer-motion";
type Props = {
  values: Record<string, string>;
  title: String;
};

function StatCard({ values, title }: Props) {
  const [activeTab, setActiveTab] = useState("Today");
  const tabs = ["Today", "This Week", "This Month", "This Year", "Overall"];

  const getValue = (values: Record<string, string>, tab: string) => {
    return values[tab];
  };
  return (
    <div className="my-1">
      <h2 className="text-3xl font-bold mb-2 text-title">{title}</h2>
      <div className="bg-primary rounded-2xl border border-secondary   p-6  mx-auto ">
        <div className="tabs flex justify-evenly bg-[#F5F5F5] dark:bg-secondary rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                " text-xs font-semibold  rounded-2xl px-2 py-2 w-full  cursor-pointer  ",
                activeTab === tab
                  ? "text-white bg-btn-primary"
                  : "text-[#B0B0B0]"
              )}
            >
              {tab}
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
            {getValue(values, activeTab)}
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
