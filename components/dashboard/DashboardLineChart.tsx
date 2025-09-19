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

export type DataType = {
  month: string;
  profit: number;
  sell: number;
  buy: number;
  expense: number;
}[];

type DashboardLineChartProps = {
  data: DataType;
};

const DashboardLineChart = ({ data }: DashboardLineChartProps) => {
  const [activeTab, setActiveTab] = useState("Profit");

  console.log(data);
  const getLineColor = () => {
    switch (activeTab) {
      case "Profit":
        return "#10B981"; // green
      case "Sell":
        return "#3B82F6"; // blue
      case "Buy":
        return "#F59E0B"; // amber
      case "Expense":
        return "#EF4444"; // red
      default:
        return "#3B82F6";
    }
  };

  const getDataKey = () => {
    return activeTab.toLowerCase();
  };

  const tabs = ["Profit", "Sell", "Buy", "Expense"];

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
