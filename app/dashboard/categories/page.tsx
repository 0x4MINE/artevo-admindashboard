"use client";

import ContentNavbar from "@/components/layout/ContentNavbar";
import CustomTable from "@/components/custom-table";
import Popup from "@/components/Popup";
import CategoriesPopup from "@/components/popups/CategoriesPopup";
import { Column } from "@/types/Column";
import FilterState from "@/types/FilterState";
import React, { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { deleteCategory, getCategory } from "@/lib/actions/categoryActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { Edit, Trash2 } from "lucide-react";
import ActiveFilterBar from "@/components/ActiveFilterBar";

function Categories() {
  const [popUp, setPopUp] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const { filters } = useFilterStore();

  useEffect(() => {
    async function fetchData() {
      const categories = await getCategory();
      console.log(categories);
      setData(categories);
    }

    fetchData();
  }, [filters]);
  const columns: Column[] = [
    { key: "id", label: "ID", type: "text" },
    { key: "name", label: "Name", type: "text" },
    { key: "isActive", label: "Status", type: "status" },
    // { key: "spent", label: "Spent this month", type: "currency" },
  ];

  const handleDelete = async (item: any) => {
    const { _id, id } = item;

    toast.promise(
      deleteCategory(_id).then((response) => {
        if (!response.success) throw new Error(response.error);
        setData((prev) => prev.filter((el) => el._id !== _id));
        return `Category ${id} has been deleted`;
      }),
      {
        loading: "Deleting category...",
        success: (msg) => msg,
        error: (err) => err?.message || "Deletion failed",
      }
    );
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />
      <ContentNavbar setSearch={setSearch} setPopUp={setPopUp} />
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
              icon: <Edit className="h-4 w-4" />,
              onClick: (item) => {
                setEditCategory(item);
                setPopUp(true);
              },
            },
            {
              label: "Delete",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: (item) => handleDelete(item),
              variant: "destructive" as const,
            },
          ]}
        />
      </div>
      <Popup
        isOpen={popUp}
        onClose={() => {
          setPopUp(false);
          setEditCategory(null);
        }}
      >
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
