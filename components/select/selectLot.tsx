"use client";
import React, { useState, useEffect } from "react";
import Popup from "@/components/Popup";
import CustomTable from "@/components/custom-table";
import { Column } from "@/types/Column";
import { getLotsByProductId } from "@/lib/actions/lotActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { toast } from "sonner";

type SelectLotProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lot: any) => void;
  productId?: string;
};

export default function SelectLot({
  isOpen,
  onClose,
  onSelect,
  productId,
}: SelectLotProps) {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any[]>([]);
  const { filters } = useFilterStore();

  const columns: Column[] = [
    { key: "lot_id", label: "ID", type: "text" },
    { key: "date", label: "Date", type: "date" },
    { key: "buyPrice", label: "Buy Price", type: "currency" },
    { key: "sellPrice", label: "Sell Price", type: "currency" },
    { key: "isActive", label: "Status", type: "status" },
    { key: "quantity", label: "Quantity", type: "text" },
    { key: "supp_name", label: "Supplier", type: "text" },
  ];

  useEffect(() => {
    if (!isOpen || !productId) return;

    async function fetchData() {
      try {
        const lots = await getLotsByProductId(productId);
        setData(lots);
      } catch (error) {
        toast.error("Failed to fetch lots");
        console.error("Error fetching lots:", error);
      }
    }

    fetchData();
  }, [isOpen, filters, productId]);

  return (
    <Popup isOpen={isOpen} onClose={onClose}>
      <div className="h-[60vh] w-full">
        {/* Header */}
        <div className="header flex justify-between items-center">
          <div className="w-10" />
          <h1 className="text-2xl text-center font-bold text-title">
            SELECT A LOT
          </h1>
          <div className="w-10" />
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
