"use client";

import AddButton from "@/components/AddButton";
import CustomTable from "@/components/custom-table";
import ContentNavbar from "@/components/layout/ContentNavbar";
import Popup from "@/components/Popup";
import SelectClient from "@/components/select/selectClient";
import { getClients } from "@/lib/actions/clientActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { Column } from "@/types/Column";
import { redirect } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

function Transactions() {
  const columns: Column[] = [
    { key: "sell_id", label: "ID", type: "text" },
    { key: "createdAt", label: "Date", type: "date" },
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
        const clients = await getClients();
        console.log("Fetched clients:", clients);
        setData(clients);
      } catch (error) {
        toast.error("Failed to fetch clients");
        console.error("Error fetching clients:", error);
      }
    }

    fetchData();
  }, [filters]);
  const handleClientSelect = (client: any) => {
    redirect(
      "/dashboard/sell/transactions/details?client_id=" + client.client_id
    );
  };
  const customColumns: Column[] = [
    { key: "client_id", label: "ID", type: "text" },
    { key: "name", label: "Customer", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "isActive", label: "Status", type: "status" },
    { key: "spentThisMonth", label: "Spent This Month", type: "currency" },
    { key: "credit", label: "Credit", type: "currency" },
  ];

  return (
    <div>
      <Toaster />
      <ContentNavbar setSearch={setSearch} setPopUp={setClientPopUp} />
      <div className="p-8">
        <CustomTable
          data={data}
          columns={customColumns}
          showActions={true}
          searchTerm={search}
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
