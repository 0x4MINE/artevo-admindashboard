"use client";

import ContentNavbar from "@/components/layout/ContentNavbar";
import CustomTable from "@/components/custom-table";
import Popup from "@/components/Popup";
import ServicesPopup from "@/components/popups/ServicesPopup";
import { Column } from "@/types/Column";
import React, { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { useFilterStore } from "@/lib/store/useFilter";
import { getService, deleteService } from "@/lib/actions/serviceActions";
import { Trash2, Pencil } from "lucide-react";
import ActiveFilterBar from "@/components/ActiveFilterBar";

function Services() {
  const [popUp, setPopUp] = useState(false);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [editService, setEditService] = useState<any>(null);
  const { filters } = useFilterStore();

  const columns: Column[] = [
    { key: "serv_id", label: "ID", type: "text" },
    { key: "name", label: "Name", type: "text" },
    { key: "buyPrice", label: "Buy Price", type: "text" },
    { key: "sellPrice", label: "Sell Price", type: "text" },
    { key: "isActive", label: "Status", type: "status" },
    { key: "tva", label: "TVA", type: "text" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const services = await getService();
        setData(services);
      } catch (error) {
        toast.error("Failed to fetch services");
        console.error("Error fetching services:", error);
      }
    }

    fetchData();
  }, [filters]);

  const handleDelete = async (service: any) => {
    if (!service._id) return;

    toast.promise(
      async () => {
        const response = await deleteService(service._id);
        if (!response?.success) {
          throw new Error(response?.error || "Failed to delete service");
        }
        setData((prev) => prev.filter((item) => item._id !== service._id));
        return `Service ${service.name} deleted successfully`;
      },
      {
        loading: "Deleting service...",
        success: (message) => message,
        error: (error) => error.message || "Delete failed",
      }
    );
  };

  const handleEdit = (service: any) => {
    setEditService(service);
    setPopUp(true);
  };

  const resetPopupState = () => {
    setPopUp(false);
    setEditService(null);
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />
      <ContentNavbar
        setSearch={setSearch}
        setPopUp={() => {
          setEditService(null);
          setPopUp(true);
        }}
      />

      <div className="p-8">
        {" "}
        <ActiveFilterBar filteredData={data} />
        <CustomTable
          data={data}
          showActions={true}
          columns={columns}
          searchTerm={search}
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

      <Popup isOpen={popUp} onClose={resetPopupState}>
        <ServicesPopup
          setData={setData}
          setPopUp={setPopUp}
          editService={editService}
          setEditService={setEditService}
        />
      </Popup>
    </div>
  );
}

export default Services;
