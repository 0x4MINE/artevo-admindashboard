"use client";

import ContentNavbar from "@/components/layout/ContentNavbar";
import CustomTable from "@/components/custom-table";
import Loader from "@/components/layout/Loader";
import Popup from "@/components/Popup";
import CategoriesPopup from "@/components/popups/CategoriesPopup";
import ActiveFilterBar from "@/components/ActiveFilterBar";
import { Column } from "@/types/Column";
import { useFilterStore } from "@/lib/store/useFilter";
import {
  getPaginatedCategories,
  deleteCategory,
} from "@/lib/actions/categoryActions";
import { toast, Toaster } from "sonner";
import { Edit, Trash2, Package } from "lucide-react";
import { redirect } from "next/navigation";
import React, { useEffect, useState } from "react";

function Categories() {
  const { filters } = useFilterStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [popUp, setPopUp] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const itemsPerPage = 5;

  const columns: Column[] = [
    { key: "cat_id", label: "ID", type: "text" },
    { key: "name", label: "Name", type: "text" },
    { key: "productCount", label: "Products", type: "text" },
    { key: "isActive", label: "Status", type: "status" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { categories, total } = await getPaginatedCategories(
          currentPage,
          itemsPerPage,
          search,
          filters
        );

        setData(categories);
        console.log(categories);
        setTotalItems(total);
      } catch (error) {
        toast.error("Failed to fetch categories");
        console.error("Error fetching categories:", error);
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

  const handleDelete = async (category: any) => {
    if (!category._id) return;

    toast.promise(
      async () => {
        const response = await deleteCategory(category._id);
        if (!response?.success) {
          throw new Error(response?.error || "Failed to delete category");
        }
        setData((prev) => prev.filter((item) => item._id !== category._id));
        setTotalItems((prev) => prev - 1);
        return `Category ${category.name} deleted successfully`;
      },
      {
        loading: "Deleting category...",
        success: (message) => message,
        error: (error) => error.message || "Delete failed",
      }
    );
  };

  const handleEdit = (category: any) => {
    setEditCategory(category);
    setPopUp(true);
  };

  const resetPopupState = () => {
    setPopUp(false);
    setEditCategory(null);
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />
      <ContentNavbar
        filters={["active"]}
        setSearch={handleSearchChange}
        setPopUp={() => {
          setEditCategory(null);
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
                label: "View Products",
                icon: <Package className="h-4 w-4" />,
                onClick: (category) => {
                  redirect("/dashboard/products?categoryId=" + category._id);
                },
              },
              {
                label: "Edit",
                icon: <Edit className="h-4 w-4" />,
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
        <CategoriesPopup
          setData={setData}
          setPopUp={setPopUp}
          editCategory={editCategory}
          setEditCategory={setEditCategory}
        />
      </Popup>
    </div>
  );
}

export default Categories;
