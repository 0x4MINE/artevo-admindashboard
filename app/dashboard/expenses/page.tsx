"use client";

import React, { useEffect, useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { toast, Toaster } from "sonner";
import ContentNavbar from "@/components/layout/ContentNavbar";
import CustomTable from "@/components/custom-table";
import Popup from "@/components/Popup";
import ExpensesPopup from "@/components/popups/ExpensesPopup";
import type { Column } from "@/types/Column";
import { useUserStore } from "@/lib/store/useUser";
import { useFilterStore } from "@/lib/store/useFilter";
import { deleteExpense, getExpense } from "@/lib/actions/expenseAction";
import type { Expense } from "@/types/expense";
import ActiveFilterBar from "@/components/ActiveFilterBar";

const columns: Column[] = [
  { key: "id", label: "ID", type: "text" },
  { key: "name", label: "Name", type: "text" },
  { key: "price", label: "Price", type: "currency" },
  { key: "createdAt", label: "Date", type: "date" },
  { key: "by", label: "By", type: "text" },
];

function Expenses() {
  const [popUp, setPopUp] = useState(false);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Expense[]>([]);
  const [editUser, setEdit] = useState<Expense | null>(null);
  const { user } = useUserStore();
  const { filters } = useFilterStore();

  useEffect(() => {
    async function fetchData() {
      try {
        const expenses = await getExpense();
        const formatted = expenses.map((e) => ({
          ...e,
          by: e.user?.name || "Unknown",
        }));
        setData(formatted);
      } catch (error) {
        toast.error("Failed to fetch expenses");
        console.error(error);
      }
    }

    fetchData();
  }, [filters]);

  const handleDelete = async (item: Expense) => {
    if (!item._id) return;

    toast.promise(
      async () => {
        await deleteExpense(item._id!);
        setData((prev) => prev.filter((el) => el._id !== item._id));
        return `Expense ${item.id} has been deleted`;
      },
      {
        loading: "Deleting expense...",
        success: (msg) => msg,
        error: (error: Error) => error.message || "Failed to delete expense",
      }
    );
  };

  const handleEdit = (item: Expense) => {
    setEdit(item);
    setPopUp(true);
  };

  const resetPopupState = () => {
    setPopUp(false);
    setEdit(null);
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />
      <ContentNavbar
        setSearch={setSearch}
        setPopUp={() => {
          setEdit(null);
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
        <ExpensesPopup
          editUser={editUser}
          setEdit={setEdit}
          setPopUp={setPopUp}
          setData={setData}
          
        />
      </Popup>
    </div>
  );
}

export default Expenses;
