"use client";

import ActiveFilterBar from "@/components/ActiveFilterBar";
import CustomTable from "@/components/custom-table";
import ContentNavbar from "@/components/layout/ContentNavbar";
import Loader from "@/components/layout/Loader";
import Popup from "@/components/Popup";
import SelectClient from "@/components/select/selectClient";
import { getPaginatedSellBons } from "@/lib/actions/transactionActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { Column } from "@/types/Column";
import { Eye, FileText, User } from "lucide-react";
import { redirect } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

function Transactions() {
  const { filters } = useFilterStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientPopUp, setClientPopUp] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const itemsPerPage = 5;

  const columns: Column[] = [
    { key: "sellBonId", label: "Bon ID", type: "text" },
    { key: "date", label: "Date", type: "date" },
    { key: "client_name", label: "Client", type: "text" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "itemCount", label: "Items", type: "text" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { sellBons, total } = await getPaginatedSellBons(
          currentPage,
          itemsPerPage,
          search,
          filters
        );

        setData(sellBons);
        console.log("Fetched sell bons:", sellBons);
        setTotalItems(total);
      } catch (error) {
        toast.error("Failed to fetch transactions");
        console.error("Error fetching transactions:", error);
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

  const handleClientSelect = (client: any) => {
    redirect(
      "/dashboard/sell/transactions/details?client_id=" + client.client_id
    );
    setClientPopUp(false);
  };

  const resetPopupState = () => {
    setClientPopUp(false);
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />
      <ContentNavbar
        filters={[ "amount", "date"]}
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
                label: "View Receipt (Bon)",
                icon: <Eye className="h-4 w-4" />,
                onClick: (bon) => {
                  window.open("/api/sell-bon?bonId=" + bon._id, "_blank");
                },
              },
              {
                label: "View Receipt (Facture)",
                icon: <FileText className="h-4 w-4" />,
                onClick: (bon) => {
                  window.open("/api/sell-facture?bonId=" + bon._id, "_blank");
                },
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

export default Transactions;
