import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { CustomTooltip } from "../CustomTooltip";

const DashboardPieChart = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = [
    { name: "Design", value: 1500, color: "#3B82F6" },
    { name: "Printing", value: 2500, color: "#10B981" },
    { name: "Copywriting", value: 900, color: "#F59E0B" },
    { name: "Ads", value: 250, color: "#BF4555" },
    { name: "Other", value: 50, color: "#EF4444" },
  ];

  const onPieEnter = (_: any, index: React.SetStateAction<number | null>) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };


  const CustomLegend = ({ payload }: { payload: any }) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-title">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-primary p-6 rounded-2xl shadow-sm border border-secondary ">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-title">Services</h2>
        <p className="text-sm text-subtitle">Distribution by Revenue</p>
      </div>

      {/* Pie Chart */}
      <div className="h-75 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={40}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={activeIndex === index ? "#374151" : "none"}
                  strokeWidth={activeIndex === index ? 2 : 0}
                  style={{
                    filter: activeIndex === index ? "brightness(1.1)" : "none",
                    transform:
                      activeIndex === index ? "scale(1.05)" : "scale(1)",
                    transformOrigin: "center",
                    transition: "all 0.2s ease-in-out",
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip active={undefined} payload={undefined} />}
            />
            <Legend content={<CustomLegend payload={undefined} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
        {data.map((item, index) => (
          <div key={index} className="text-center">
            <div 
              className="w-4 h-4 rounded-full mx-auto mb-2" 
              style={{ backgroundColor: item.color }}
            />
            <p className="text-2xl font-bold text-gray-800">{item.value}%</p>
            <p className="text-sm text-gray-500">{item.name}</p>
          </div>
        ))}
      </div> */}
    </div>
  );
};

export default DashboardPieChart;
