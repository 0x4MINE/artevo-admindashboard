import { LucideProps } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
type Props = {
  label: string;
  amount: string;
  Icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
};

function DashboardCard({ label, amount, Icon }: Props) {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 25px -12px rgba(0,0,0,0.1) " }}
      className="flex items-center justify-center gap-6 bg-primary w-full  px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition"
    >
      <div className="bg-secondary p-4 rounded-full">
        <Icon size={32} className="text-btn-secondary " />
      </div>

      <div className="flex flex-col">
        <span className="text-sm text-subtitle">{label}</span>
        <span className="text-3xl font-bold text-title">{amount}</span>
      </div>
    </motion.div>
  );
}

export default DashboardCard;
