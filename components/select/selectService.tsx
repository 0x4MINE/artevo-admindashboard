"use client";
import React, { useState, useEffect } from "react";
import Popup from "@/components/Popup";
import CustomTable from "@/components/custom-table";
import { Column } from "@/types/Column";
import { getService } from "@/lib/actions/serviceActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { toast } from "sonner";

type SelectServiceProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (service: any) => void;
};

export default function SelectService({
  isOpen,
  onClose,
  onSelect,
}: SelectServiceProps) {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any[]>([]);
  const { filters } = useFilterStore();

  const columns: Column[] = [
    { key: "serv_id", label: "ID", type: "text" },
    { key: "name", label: "Name", type: "text" },
    { key: "buyPrice", label: "Buy Price", type: "text" },
    { key: "sellPrice", label: "Sell Price", type: "text" },
    { key: "isActive", label: "Status", type: "status" },
    { key: "tva", label: "TVA", type: "text" },
  ];


  useEffect(() => {
    if (!isOpen) return;

    async function fetchData() {
      try {
        const services = await getService();
        console.log(services);
        setData(services);
      } catch (error) {
        toast.error("Failed to fetch services");
        console.error("Error fetching services:", error);
      }
    }

    fetchData();
  }, [isOpen, filters]);

  return (
    <Popup isOpen={isOpen} onClose={onClose}>
      <div className="h-[60vh] w-full">
        {/* Header */}
        <div className="header flex justify-between items-center">
          <div className="w-10" />
          <h1 className="text-2xl text-center font-bold text-title">
            SELECT A SERVICE
          </h1>
          <button className="py-2 px-4 bg-btn-primary text-white rounded-[10px] font-bold">
            +
          </button>
        </div>

        {/* Search */}
        <div className="flex justify-center items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-secondary my-6 py-2 px-4 rounded-2xl focus:outline-none"
            placeholder="Search..."
          />
        </div>

        {/* Table */}
        <CustomTable
          data={data}
          columns={columns}
          showActions={false}
          searchTerm={search}
          onDoubleClick={(row) => {
            onSelect(row);
            onClose();
          }}
        />
      </div>
    </Popup>
  );
}
