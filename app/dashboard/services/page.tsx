"use client";

import ContentNavbar from "@/components/layout/ContentNavbar";
import CustomTable from "@/components/custom-table";
import Loader from "@/components/layout/Loader";
import Popup from "@/components/Popup";
import ServicesPopup from "@/components/popups/ServicesPopup";
import ActiveFilterBar from "@/components/ActiveFilterBar";
import { Column } from "@/types/Column";
import { useFilterStore } from "@/lib/store/useFilter";
import { getPaginatedServices, deleteService } from "@/lib/actions/serviceActions";
import { Toaster, toast } from "sonner";
import { Trash2, Pencil } from "lucide-react";
import React, { useEffect, useState } from "react";

function Services() {
  const { filters } = useFilterStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [popUp, setPopUp] = useState(false);
  const [editService, setEditService] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const itemsPerPage = 5;

  const columns: Column[] = [
    { key: "serv_id", label: "ID", type: "text" },
    { key: "name", label: "Name", type: "text" },
    { key: "buyPrice", label: "Buy Price", type: "currency" },
    { key: "sellPrice", label: "Sell Price", type: "currency" },
    { key: "isActive", label: "Status", type: "status" },
    { key: "tva", label: "TVA", type: "text" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { services, total } = await getPaginatedServices(
          currentPage,
          itemsPerPage,
          search,
          filters
        );
        
        setData(services);
        console.log(services);
        setTotalItems(total);
      } catch (error) {
        toast.error("Failed to fetch services");
        console.error("Error fetching services:", error);
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

  const handleDelete = async (service: any) => {
    if (!service._id) return;

    toast.promise(
      async () => {
        const response = await deleteService(service._id);
        if (!response?.success) {
          throw new Error(response?.error || "Failed to delete service");
        }
        setData((prev) => prev.filter((item) => item._id !== service._id));
        setTotalItems((prev) => prev - 1);
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
        filters={["active", "buyAmount", "sellAmount"]}
        setSearch={handleSearchChange}
        setPopUp={() => {
          setEditService(null);
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