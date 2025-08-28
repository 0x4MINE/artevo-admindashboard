"use client";

import CustomTable from "@/components/custom-table";
import ContentNavbar from "@/components/layout/ContentNavbar";
import Popup from "@/components/Popup";
import SelectSupplier from "@/components/select/selectSupplier";
import { getBuyBons } from "@/lib/actions/transactionActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { Column } from "@/types/Column";
import { Eye } from "lucide-react";
import { redirect } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

function Transactions() {
  const columns: Column[] = [
    { key: "buy_id", label: "ID", type: "text" },
    { key: "date", label: "Date", type: "date" },
    { key: "supplier_name", label: "Supplier", type: "text" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "by", label: "By", type: "text" },
  ];

  const [supplierPopUp, setSupplierPopUp] = useState(false);
  const [data, setData] = useState([]);
  const { filters } = useFilterStore();
  const [search, setSearch] = useState("");

  const resetPopupState = () => {
    setSupplierPopUp(false);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const bons = await getBuyBons();
        console.log("Fetched buy transactions:", bons);
        setData(bons);
      } catch (error) {
        toast.error("Failed to fetch buy transactions");
        console.error("Error fetching buy transactions:", error);
      }
    }

    fetchData();
  }, [filters]);

  const handleSupplierSelect = (supplier: any) => {
    redirect(
      "/dashboard/buy/transactions/details?supp_id=" + supplier.supp_id
    );
  };

  return (
    <div>
      <Toaster />
      <ContentNavbar setSearch={setSearch} setPopUp={setSupplierPopUp} />
      <div className="p-8">
        <CustomTable
          data={data}
          columns={columns}
          showActions={true}
          searchTerm={search}
          actions={[
            {
              label: "View",
              icon: <Eye className="h-4 w-4" />,
              onClick: (bon) => {
                window.open(
                  "/api/buy-bon?bonId=" + bon._id,
                  "_blank"
                );
              },
            },
          ]}
        />
      </div>
      <SelectSupplier
        isOpen={supplierPopUp}
        onClose={resetPopupState}
        onSelect={handleSupplierSelect}
      />
    </div>
  );
}

export default Transactions;