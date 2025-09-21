"use client";

import ActiveFilterBar from "@/components/ActiveFilterBar";
import ContentNavbar from "@/components/layout/ContentNavbar";
import CustomTable from "@/components/custom-table";
import Loader from "@/components/layout/Loader";
import Popup from "@/components/Popup";
import ClientPopup from "@/components/popups/ClientPopup";
import { Column } from "@/types/Column";
import { useFilterStore } from "@/lib/store/useFilter";
import { getPaginatedClients, deleteClient } from "@/lib/actions/clientActions";
import { Toaster, toast } from "sonner";
import { Pencil, Trash2, FileText, User } from "lucide-react";
import { redirect } from "next/navigation";
import React, { useState, useEffect } from "react";

function Clients() {
  const { filters } = useFilterStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [popUp, setPopUp] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const itemsPerPage = 5;

  const columns: Column[] = [
    { key: "client_id", label: "ID", type: "text" },
    { key: "name", label: "Customer", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "isActive", label: "Status", type: "status" },
    { key: "spentThisMonth", label: "Spent This Month", type: "currency" },
    { key: "debt", label: "Debt", type: "currency" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { clients, total } = await getPaginatedClients(
          currentPage,
          itemsPerPage,
          search,
          filters
        );

        setData(clients);
        console.log(clients);
        setTotalItems(total);
      } catch (error) {
        toast.error("Failed to fetch clients");
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [filters, currentPage, search]);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setCurrentPage(1);
  };

  const handleDelete = async (client: any) => {
    if (!client._id) return;

    toast.promise(
      async () => {
        const response = await deleteClient(client._id);
        if (!response?.success) {
          throw new Error(response?.error || "Failed to delete client");
        }
        setData((prev) => prev.filter((item) => item._id !== client._id));
        setTotalItems((prev) => prev - 1);
        return `Client ${client.name} deleted successfully`;
      },
      {
        loading: "Deleting client...",
        success: (message) => message,
        error: (error) => error.message || "Delete failed",
      }
    );
  };

  const handleEdit = (client: any) => {
    setEditClient(client);
    setPopUp(true);
  };

  const resetPopupState = () => {
    setPopUp(false);
    setEditClient(null);
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />
      <ContentNavbar
        filters={["active", "debtAmount", "spentAmount"]}
        setSearch={handleSearchChange}
        setPopUp={() => {
          setEditClient(null);
          setPopUp(true);
        }}
      />

      <div className="p-8">
        <ActiveFilterBar filteredData={data} />

        {loading ? (
          <Loader />
        ) : (
          <CustomTable
            showPagination
            itemsPerPage={itemsPerPage}
            columns={columns}
            data={data}
            searchTerm={search}
            showActions={true}
            actions={[
              {
                label: "View Profile",
                icon: <User className="h-4 w-4" />,
                onClick: (client) => {
                  redirect("/dashboard/clients/" + client._id);
                },
              },
              {
                label: "View Invoices",
                icon: <FileText className="h-4 w-4" />,
                onClick: (client) => {
                  redirect("/dashboard/invoices?clientId=" + client._id);
                },
              },
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
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
          />
        )}
      </div>

      <Popup isOpen={popUp} onClose={resetPopupState}>
        <ClientPopup
          setData={setData}
          setPopUp={setPopUp}
          editClient={editClient}
          setEditClient={setEditClient}
        />
      </Popup>
    </div>
  );
}

export default Clients;
