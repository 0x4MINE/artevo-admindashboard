import clsx from "clsx";
import React from "react";

type TTabsProps = {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: any) => void;
  className?: string;
};

function Tabs({ tabs, activeTab, setActiveTab, className }: TTabsProps) {
  return (
    <div className="tabs flex gap-2 bg-[#F5F5F5] dark:bg-secondary rounded-2xl">
      {tabs.map((tab: any) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={clsx(
            " text-sm font-semibold  rounded-2xl px-4 py-2 w-full  cursor-pointer  ",
            activeTab === tab ? "text-white bg-btn-primary" : "text-[#B0B0B0]",
            className
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
