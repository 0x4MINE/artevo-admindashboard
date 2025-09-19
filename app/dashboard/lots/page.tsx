"use client";
import ActiveFilterBar from "@/components/ActiveFilterBar";
import CustomTable from "@/components/custom-table";
import ContentNavbar from "@/components/layout/ContentNavbar";
import Loader from "@/components/layout/Loader";
import { getLotsPaginated } from "@/lib/actions/lotActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { Column } from "@/types/Column";
import React, { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

function Lots() {
  const { filters } = useFilterStore();
  const [data, setData] = useState([]);
  const [popUp, setPopUp] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 5;

  const columns: Column[] = [
    { key: "lot_id", label: "ID", type: "text" },
    { key: "date", label: "Date", type: "date" },
    { key: "buyPrice", label: "Buy Price", type: "currency" },
    { key: "sellPrice", label: "Sell Price", type: "currency" },
    { key: "isActive", label: "Status", type: "status" },
    { key: "quantity", label: "Quantity", type: "text" },
    { key: "supp_name", label: "Supplier", type: "text" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { lots, total } = await getLotsPaginated(
          currentPage,
          itemsPerPage,
          search,
          filters
        );
        console.log(lots);
        setData(lots);
        setTotalItems(total);
      } catch (error) {
        toast.error("Failed to fetch lots");
        console.error(error);
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

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />
      <ContentNavbar setSearch={handleSearchChange} setPopUp={setPopUp} />
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
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
          />
        )}
      </div>
    </div>
  );
}

export default Lots;
