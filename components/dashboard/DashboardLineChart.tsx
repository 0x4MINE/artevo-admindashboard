import clsx from "clsx";
import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
  CartesianGrid,
  CartesianAxis,
} from "recharts";
import Tabs from "../Tabs";
import { CustomTooltip } from "../CustomTooltip";

const DashboardLineChart = () => {
  const [activeTab, setActiveTab] = useState("Profit");

  const data = [
    { month: "Jan", profit: 4000, sell: 3500, buy: 1800 },
    { month: "Feb", profit: 2000, sell: 2800, buy: 2200 },
    { month: "Mar", profit: 3000, sell: 0, buy: 2000 },
    { month: "Apr", profit: 3500, sell: 4100, buy: 2400 },
    { month: "May", profit: 2000, sell: 6800, buy: 900 },
    { month: "Jun", profit: 1000, sell: 6800, buy: 200 },
    { month: "jul", profit: 5000, sell: 6800, buy: 5000 },
  ];

  const getLineColor = () => {
    switch (activeTab) {
      case "Profit":
        return "#10B981";
      case "Sell":
        return "#3B82F6";
      case "Buy":
        return "#F59E0B";
      default:
        return "#3B82F6";
    }
  };

  const getDataKey = () => {
    return activeTab.toLowerCase();
  };

  const tabs = ["Profit", "Sell", "Buy"];

  return (
    <div className="bg-primary p-6 rounded-2xl shadow-sm border border-secondary ">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800"></h2>

        {/* Tab Navigation */}
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            title="Stats"
            data={data}
            margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="month"
              axisLine={true}
              tickLine={true}
              tick={{ fontSize: 12, fill: "#9CA3AF" }}
            />
            <YAxis
              axisLine={true}
              tickLine={true}
              tick={{ fontSize: 12, fill: "#9CA3AF" }}
              domain={[0, "dataMax + 1000"]}
            />
            <Line
              type="monotone"
              dataKey={getDataKey()}
              stroke={getLineColor()}
              strokeWidth={2}
              dot={{ fill: getLineColor(), strokeWidth: 1, r: 2 }}
              activeDot={{ r: 6, fill: getLineColor() }}
            />
            <Tooltip
              content={<CustomTooltip active={undefined} payload={undefined} />}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="text-center mt-4">
        <p className="text-sm text-subtitle">Current Month</p>
        <p className="text-sm text-title font-medium">October</p>
      </div>
    </div>
  );
};

export default DashboardLineChart;
