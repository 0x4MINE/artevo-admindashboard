"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import ContentNavbar from "@/components/layout/ContentNavbar";
import CustomTable from "@/components/custom-table";
import Loader from "@/components/layout/Loader";
import Popup from "@/components/Popup";
import SupplierPopup from "@/components/popups/SupplierPopup";
import ActiveFilterBar from "@/components/ActiveFilterBar";
import { Column } from "@/types/Column";
import { useFilterStore } from "@/lib/store/useFilter";
import {
  getPaginatedSuppliers,
  deleteSupplier,
} from "@/lib/actions/supplierActions";

function Suppliers() {
  const { filters } = useFilterStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [popUp, setPopUp] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const itemsPerPage = 5;

  const columns: Column[] = [
    { key: "supp_id", label: "ID", type: "text" },
    { key: "createdAt", label: "Created", type: "date" },
    { key: "name", label: "Supplier", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "isActive", label: "Status", type: "status" },
    { key: "debt", label: "Debt", type: "currency" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { suppliers, total } = await getPaginatedSuppliers(
          currentPage,
          itemsPerPage,
          search,
          filters
        );

        console.log(suppliers)
        setData(suppliers);
        setTotalItems(total);
      } catch (error) {
        toast.error("Failed to fetch suppliers");
        console.error("Error fetching suppliers:", error);
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

  const handleDelete = async (supplier: any) => {
    if (!supplier._id) return;

    toast.promise(
      async () => {
        const response = await deleteSupplier(supplier._id);
        if (!response?.success) {
          throw new Error(response?.error || "Failed to delete supplier");
        }
        setData((prev) => prev.filter((item) => item._id !== supplier._id));
        setTotalItems((prev) => prev - 1);
        return `Supplier ${supplier.name} deleted successfully`;
      },
      {
        loading: "Deleting supplier...",
        success: (message) => message,
        error: (error) => error.message || "Delete failed",
      }
    );
  };

  const handleEdit = (supplier: any) => {
    setEditSupplier(supplier);
    setPopUp(true);
  };

  const resetPopupState = () => {
    setPopUp(false);
    setEditSupplier(null);
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />
      <ContentNavbar
        filters={["active", "debtAmount", "date"]}
        setSearch={handleSearchChange}
        setPopUp={() => {
          setEditSupplier(null);
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
        <SupplierPopup
          setData={setData}
          setPopUp={setPopUp}
          editSupplier={editSupplier}
          setEditSupplier={setEditSupplier}
        />
      </Popup>
    </div>
  );
}

export default Suppliers;
