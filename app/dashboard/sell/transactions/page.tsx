"use client";

import AddButton from "@/components/AddButton";
import CustomTable from "@/components/custom-table";
import ContentNavbar from "@/components/layout/ContentNavbar";
import Popup from "@/components/Popup";
import SelectClient from "@/components/select/selectClient";
import { getClients } from "@/lib/actions/clientActions";
import { getSellBons } from "@/lib/actions/transactionActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { Column } from "@/types/Column";
import { Eye } from "lucide-react";
import { redirect } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Label } from "recharts";
import { toast, Toaster } from "sonner";

function Transactions() {
  const columns: Column[] = [
    { key: "sell_id", label: "ID", type: "text" },
    { key: "date", label: "Date", type: "date" },
    { key: "client_name", label: "Client", type: "text" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "by", label: "By", type: "text" },
  ];

  const [clientPopUp, setClientPopUp] = useState(false);
  const [data, setData] = useState([]);
  const { filters } = useFilterStore();
  const [search, setSearch] = useState("");

  const resetPopupState = () => {
    setClientPopUp(false);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const bons = await getSellBons();
        console.log("Fetched clients:", bons);
        setData(bons);
      } catch (error) {
        toast.error("Failed to fetch bons");
        console.error("Error fetching bons:", error);
      }
    }

    fetchData();
  }, [filters]);
  const handleClientSelect = (client: any) => {
    redirect(
      "/dashboard/sell/transactions/details?client_id=" + client.client_id
    );
  };

  return (
    <div>
      <Toaster />
      <ContentNavbar setSearch={setSearch} setPopUp={setClientPopUp} />
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
                  "/api/bon?bonId=" + bon._id,
                  "_blank"
                );
              },
            },
          ]}
        />
      </div>
      <SelectClient
        isOpen={clientPopUp}
        onClose={resetPopupState}
        onSelect={handleClientSelect}
      />
    </div>
  );
}

export default Transactions;
