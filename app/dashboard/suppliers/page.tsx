"use client";

import AddButton from "@/components/AddButton";
import AddTextInput from "@/components/forms/AddTextInput";
import ContentNavbar from "@/components/layout/ContentNavbar";
import CustomTable from "@/components/custom-table";
import Popup from "@/components/Popup";
import { generate7DigitId } from "@/lib/utils";
import { Column } from "@/types/Column";
import { Pencil, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import ActiveFilterBar from "@/components/ActiveFilterBar";
import { useFilterStore } from "@/lib/store/useFilter";
import {
  createSupplier,
  getSuppliers,
  deleteSupplier,
} from "@/lib/actions/supplierActions";
import SupplierPopup from "@/components/popups/SupplierPopup";

function Suppliers() {
  const [popUp, setPopUp] = useState(false);
  const [search, setSearch] = useState("");
  const { filters } = useFilterStore();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getSuppliers();
        console.log(result)
        setData(result);
      } catch (error) {
        toast.error("Failed to fetch suppliers");
        console.error("Error fetching suppliers:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [filters, search]);

  const customColumns: Column[] = [
    { key: "supp_id", label: "ID", type: "text" },
    { key: "name", label: "Supplier", type: "text" },
    { key: "createdAt", label: "Date", type: "date" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "isActive", label: "Status", type: "status" },
  ];

  const handleDelete = async (supplier: any) => {
    try {
      setIsLoading(true);
      
      const result = await deleteSupplier(supplier._id);

      if (result.success) {
        setData((prev) => prev.filter((item) => item._id !== supplier._id));
        toast.success(`Supplier ${supplier.name} deleted successfully`);
      } else {
        toast.error(result.error || "Failed to delete supplier");
      }
    } catch (error) {
      toast.error("Failed to delete supplier");
      console.error("Error deleting supplier:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (supplier: any) => {
    setEditSupplier(supplier);
    setPopUp(true);
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />

      <ContentNavbar setPopUp={setPopUp} setSearch={setSearch} />

      <div className="p-8">
        <ActiveFilterBar filteredData={data} />

        <CustomTable
          searchTerm={search}
          className=""
          data={data}
          columns={customColumns}
          actions={[
            {
              label: "Edit",
              icon: <Pencil className="h-4 w-4" />,
              onClick: handleEdit,
              variant: "default",
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

      <Popup
        isOpen={popUp}
        onClose={() => {
          setPopUp(false);
          setEditSupplier(null);
        }}
      >
        <SupplierPopup
          setData={setData}
          setPopUp={setPopUp}
          setEditSupplier={setEditSupplier}
          editSupplier={editSupplier}
        />
      </Popup>
    </div>
  );
}

export default Suppliers;