"use client";

import React, { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { toast, Toaster } from "sonner";
import ContentNavbar from "@/components/layout/ContentNavbar";
import CustomTable from "@/components/custom-table";
import Loader from "@/components/layout/Loader";
import Popup from "@/components/Popup";
import ActiveFilterBar from "@/components/ActiveFilterBar";
import PaymentPopup from "@/components/popups/clientPaymentPopup";
import { Column } from "@/types/Column";
import { useFilterStore } from "@/lib/store/useFilter";
import { 
  getClientPaymentsPaginated, 
  deleteClientPaym
} from "@/lib/actions/clientPaymentActions";

function Payment() {
  const { filters } = useFilterStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [popUp, setPopUp] = useState(false);
  const [editPayment, setEditPayment] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const itemsPerPage = 5;

  const columns: Column[] = [
    { key: "clientPay_id", label: "ID", type: "text" },
    { key: "date", label: "Date", type: "date" },
    { key: "client_name", label: "Client", type: "text" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "by", label: "By", type: "text" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { payments, total } = await getClientPaymentsPaginated(
          currentPage,
          itemsPerPage,
          search,
          filters
        );
        
        setData(payments);
        setTotalItems(total);
      } catch (error) {
        toast.error("Failed to fetch payments");
        console.error("Error fetching payments:", error);
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

  const handleDelete = async (payment: any) => {
    if (!payment._id) return;

    toast.promise(
      async () => {
        const response = await deleteClientPaym(payment._id);
        if (!response?.success) {
          throw new Error(response?.error || "Failed to delete payment");
        }
        setData((prev) => prev.filter((item) => item._id !== payment._id));
        setTotalItems((prev) => prev - 1);
        return `Payment ${payment.clientPay_id} deleted successfully`;
      },
      {
        loading: "Deleting payment...",
        success: (message) => message,
        error: (error) => error.message || "Delete failed",
      }
    );
  };

  const handleEdit = (payment: any) => {
    setEditPayment(payment);
    setPopUp(true);
  };

  const resetPopupState = () => {
    setPopUp(false);
    setEditPayment(null);
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />
      <ContentNavbar
        filters={[ "amount", "date"]}
        setSearch={handleSearchChange}
        setPopUp={() => {
          setEditPayment(null);
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
                label: "Edit",
                icon: <Pencil className="h-4 w-4" />,
                onClick: handleEdit,
              },
              {
                label: "Delete",
                icon: <Pencil className="h-4 w-4" />,
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
        <PaymentPopup
          setEditPayment={setEditPayment}
          editPayment={editPayment}
          setData={setData}
          setPopUp={setPopUp}
        />
      </Popup>
    </div>
  );
}

export default Payment;