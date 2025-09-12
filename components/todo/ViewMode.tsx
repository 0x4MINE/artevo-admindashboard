import { CalendarDays, Archive } from "lucide-react";
import React from "react";
import Tabs from "../Tabs";

export default function ViewModeSwitcher() {
  const [viewMode, setViewMode] = React.useState("today");

  const tabs = ["today", "Projects"];

  return (
    <div className="flex items-center gap-4 mb-4">
      <Tabs tabs={tabs} activeTab={viewMode} setActiveTab={setViewMode} />
    </div>
  );
}
