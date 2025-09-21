"use client";

import ActiveFilterBar from "@/components/ActiveFilterBar";
import CustomTable from "@/components/custom-table";
import ContentNavbar from "@/components/layout/ContentNavbar";
import Loader from "@/components/layout/Loader";
import Popup from "@/components/Popup";
import SelectSupplier from "@/components/select/selectSupplier";
import { getPaginatedBuyFacts } from "@/lib/actions/transactionActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { Column } from "@/types/Column";
import { Eye, FileText, Trash, User } from "lucide-react";
import { redirect } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

function Transactions() {
  const { filters } = useFilterStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [supplierPopUp, setSupplierPopUp] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const itemsPerPage = 5;

  const columns: Column[] = [
    { key: "buyFactId", label: "Fact ID", type: "text" },
    { key: "date", label: "Date", type: "date" },
    { key: "supplier_name", label: "Supplier", type: "text" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "reglement", label: "Payment", type: "text" },
    { key: "itemCount", label: "Items", type: "text" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { buyFacts, total } = await getPaginatedBuyFacts(
          currentPage,
          itemsPerPage,
          search,
          filters
        );

        setData(buyFacts);
        console.log("Fetched buy facts:", buyFacts);
        setTotalItems(total);
      } catch (error) {
        toast.error("Failed to fetch buy transactions");
        console.error("Error fetching buy transactions:", error);
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

  const handleSupplierSelect = (supplier: any) => {
    redirect("/dashboard/buy/transactions/details?supp_id=" + supplier.supp_id);
    setSupplierPopUp(false);
  };

  const resetPopupState = () => {
    setSupplierPopUp(false);
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />
      <ContentNavbar
        filters={["amount", "date"]}
        setSearch={handleSearchChange}
        setPopUp={() => setSupplierPopUp(true)}
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
              // {
              //   label: "View Receipt (Bon)",
              //   icon: <Eye className="h-4 w-4" />,
              //   onClick: (fact) => {
              //     window.open("/api/buy-bon?factId=" + fact._id, "_blank");
              //   },
              // },
              // {
              //   label: "View Receipt (Facture)",
              //   icon: <FileText className="h-4 w-4" />,
              //   onClick: (fact) => {
              //     window.open("/api/buy-facture?factId=" + fact._id, "_blank");
              //   },
              // },

              {
                label: "Delete",
                icon: <Trash className="h-4 w-4" />,
                variant: "destructive",
                onClick: () => {},
              },
            ]}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
          />
        )}
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
