"use client";

import ActiveFilterBar from "@/components/ActiveFilterBar";
import AddButton from "@/components/AddButton";
import AddTextInput from "@/components/forms/AddTextInput";
import ContentNavbar from "@/components/layout/ContentNavbar";
import CustomTable from "@/components/custom-table";
import Popup from "@/components/Popup";
import { generate7DigitId } from "@/lib/utils";
import { Column } from "@/types/Column";
import FilterState from "@/types/FilterState";
import { Pencil, Trash2 } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { useFilterStore } from "@/lib/store/useFilter";
import { getClients } from "@/lib/actions/clientActions";
import ClientPopup from "@/components/popups/ClientPopup";

function Clients() {
  const [popUp, setPopUp] = useState(false);
  const [search, setSearch] = useState("");
  const [editClient, setEditClient] = useState(null);

  const { filters } = useFilterStore();
  const [data, setData] = useState([]);
  useEffect(() => {
    async function fetchData() {
      try {
        const clients = await getClients();
        console.log(clients);
        setData(clients);
      } catch (error) {
        toast.error("Failed to fetch clients");
        console.error("Error fetching clients:", error);
      }
    }

    fetchData();
  }, [filters]);

  const customColumns: Column[] = [
    { key: "client_id", label: "ID", type: "text" },
    { key: "name", label: "Customer", type: "text" },
    { key: "email", label: "email", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "isActive", label: "Status", type: "status" },
    { key: "spentThisMonth", label: "Spent This Month", type: "currency" },
    { key: "debt", label: "Debt", type: "currency" },
  ];

  const handleDelete = (itemToDelete: any) => {
    setData((prev) => prev.filter((item) => item.id !== itemToDelete.id));
    toast.success(`Client ${itemToDelete.name} has been deleted`);
  };

  const handleEdit = (client: any) => {
    setEditClient(client);
    setPopUp(true);
  };
  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />

      <ContentNavbar setPopUp={setPopUp} setSearch={setSearch} />

      <div className="p-8">
        {/* Active filters */}
        <ActiveFilterBar filteredData={data} />

        <CustomTable
          searchTerm={search}
          className=""
          data={data}
          columns={customColumns}
          itemsPerPage={5}
          showPagination={true}
          actions={[
            {
              label: "Edit",
              icon: <Pencil className="h-4 w-4" />,
              onClick: handleEdit,
            },
            {
              label: "Delete",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: handleDelete,
              variant: "destructive",
            },
          ]}
        />
      </div>

      <Popup isOpen={popUp} onClose={() => setPopUp(false)}>
        <ClientPopup
          setData={setData}
          setPopUp={setPopUp}
          setEditClient={setEditClient}
          editClient={editClient}
        />
      </Popup>
    </div>
  );
}

export default Clients;
