"use client";
import React, { useState, useEffect } from "react";
import Popup from "@/components/Popup";
import CustomTable from "@/components/custom-table";
import { Column } from "@/types/Column";
import { getSuppliers } from "@/lib/actions/supplierActions"; 
import { useFilterStore } from "@/lib/store/useFilter";
import { toast } from "sonner";
import { getBuyBons } from "@/lib/actions/transactionActions";

type SelectSupplierProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (supplier: any) => void;
};

export default function SelectBuyFact({
  isOpen,
  onClose,
  onSelect,
}: SelectSupplierProps) {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any[]>([]);
  const { filters } = useFilterStore();

  const columns: Column[] = [
    { key: "buy_id", label: "ID", type: "text" },
    { key: "date", label: "Date", type: "date" },
    { key: "supplier_name", label: "Supplier", type: "text" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "by", label: "By", type: "text" },
  ];

  useEffect(() => {
    if (!isOpen) return;

    async function fetchData() {
      try {
        const invoices = await getBuyBons();
        console.log(invoices);
        setData(invoices);
      } catch (error) {
        toast.error("Failed to fetch invoices");
        console.error("Error fetching invoices:", error);
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
            SELECT AN INVOICE
          </h1>
          <button
            onClick={onClose}
            className="py-2 px-4 bg-btn-primary text-white rounded-[10px] whitespace-nowrap hover:opacity-90 transition-opacity flex items-center gap-2 font-bold"
          >
            <span className="text-lg">×</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex justify-center items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-sm bg-secondary text-[#B0B0B0] my-6 py-2 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
