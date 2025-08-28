"use client";
import React, { useState, useEffect } from "react";
import Popup from "@/components/Popup";
import CustomTable from "@/components/custom-table";
import { Column } from "@/types/Column";
import { getProduct } from "@/lib/actions/productsActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { toast } from "sonner";
import ProductPopup from "../popups/ProductsPopup";

type SelectProductProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: any) => void;
};

export default function SelectProduct({
  isOpen,
  onClose,
  onSelect,
}: SelectProductProps) {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [popUp, setPopUp] = useState(false);
  const { filters } = useFilterStore();

  const columns: Column[] = [
    { key: "prod_id", label: "ID", type: "text" },
    { key: "barcode_id", label: "Barcode", type: "text" },
    { key: "name", label: "Name", type: "text" },
    { key: "quantity", label: "Quantity", type: "text" },
    { key: "isActive", label: "Status", type: "status" },
    { key: "categoryName", label: "Category", type: "text" },
  ];

  useEffect(() => {
    if (!isOpen) return;

    async function fetchData() {
      try {
        const products = await getProduct();
        console.log(products);
        setData(products);
      } catch (error) {
        toast.error("Failed to fetch products");
        console.error("Error fetching products:", error);
      }
    }

    fetchData();
  }, [isOpen, filters]);

  return (
    <Popup isOpen={isOpen} onClose={onClose}>
      <div className="h-[60vh] w-full">
        {/* Header */}
        <div className="header relative flex justify-between items-center">
          <div />

          <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold text-title">
            SELECT A PRODUCT
          </h1>

          <button
            onClick={() => setPopUp(true)}
            className="py-2 px-4 bg-btn-primary text-white rounded-[10px] font-bold flex items-center justify-center gap-3"
          >
            <span className="font-bold text-2xl">+</span> New PRODUCT
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
      <Popup isOpen={popUp} onClose={() => setPopUp(false)}>
        <ProductPopup
          setData={setData}
          setPopUp={setPopUp}
          setEditProduct={() => {}}
          editProduct={null}
        />
      </Popup>
    </Popup>
  );
}
