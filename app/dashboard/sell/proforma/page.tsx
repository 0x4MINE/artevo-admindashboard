"use client";

import ActiveFilterBar from "@/components/ActiveFilterBar";
import CustomTable from "@/components/custom-table";
import ContentNavbar from "@/components/layout/ContentNavbar";
import Loader from "@/components/layout/Loader";
import SelectClient from "@/components/select/selectClient";
import { getPaginatedProformas, deleteProforma } from "@/lib/actions/transactionActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { formatBillNo } from "@/lib/utils";
import { Column } from "@/types/Column";
import { Eye, Trash2, FileText, User, Edit } from "lucide-react";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

function Proforma() {
  const { filters } = useFilterStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientPopUp, setClientPopUp] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const router = useRouter();

  const itemsPerPage = 5; 

  const columns: Column[] = [
    { key: "sell_id", label: "ID", type: "text" },
    { key: "date", label: "Date", type: "date" },
    { key: "client_name", label: "Client", type: "text" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "itemCount", label: "Items", type: "text" },
    { key: "by", label: "By", type: "text" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { proformas, total } = await getPaginatedProformas(
          currentPage,
          itemsPerPage,
          search,
          filters
        );
        
        
        
        setData(proformas);
        setTotalItems(total);
      } catch (error) {
        toast.error("Failed to fetch proformas");
        console.error("Error fetching proformas:", error);
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

  const handleDelete = async (proforma: any) => {
    if (!proforma._id) return;

    toast.promise(
      async () => {
        const response = await deleteProforma(proforma._id);
        if (!response?.success) {
          throw new Error(response?.error || "Failed to delete proforma");
        }
        setData((prev) => prev.filter((item) => item._id !== proforma._id));
        setTotalItems((prev) => prev - 1);
        return `Proforma ${proforma.sell_id} deleted successfully`;
      },
      {
        loading: "Deleting proforma...",
        success: (message) => message,
        error: (error) => error.message || "Delete failed",
      }
    );
  };

  const handleClientSelect = (client: any) => {
    redirect("/dashboard/sell/proforma/details?client_id=" + client.client_id);
    setClientPopUp(false);
  };

  const resetPopupState = () => {
    setClientPopUp(false);
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />
      <ContentNavbar
        filters={["amount", "date"]}
        setSearch={handleSearchChange}
        setPopUp={() => setClientPopUp(true)}
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
                label: "View PDF",
                icon: <Eye className="h-4 w-4" />,
                onClick: (proforma) => {
                  window.open("/api/proforma?proformaId=" + proforma._id, "_blank");
                },
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

      <SelectClient
        isOpen={clientPopUp}
        onClose={resetPopupState}
        onSelect={handleClientSelect}
      />
    </div>
  );
}

export default Proforma;