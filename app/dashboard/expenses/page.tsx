"use client";

import React, { useEffect, useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { toast, Toaster } from "sonner";
import ContentNavbar from "@/components/layout/ContentNavbar";
import CustomTable from "@/components/custom-table";
import Popup from "@/components/Popup";
import ExpensesPopup from "@/components/popups/ExpensesPopup";
import Loader from "@/components/layout/Loader";
import ActiveFilterBar from "@/components/ActiveFilterBar";
import type { Column } from "@/types/Column";
import { useUserStore } from "@/lib/store/useUser";
import { useFilterStore } from "@/lib/store/useFilter";
import {
  deleteExpense,
  getExpensesPaginated,
} from "@/lib/actions/expenseAction";
import type { Expense } from "@/types/expense";

const columns: Column[] = [
  { key: "expense_id", label: "ID", type: "text" },
  { key: "name", label: "Name", type: "text" },
  { key: "price", label: "Amount", type: "currency" },
  { key: "createdAt", label: "Date", type: "date" },
  { key: "by", label: "By", type: "text" },
  { key: "isActive", label: "Status", type: "status" },
];

function Expenses() {
  const { filters } = useFilterStore();
  const { user } = useUserStore();
  const [data, setData] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [popUp, setPopUp] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const itemsPerPage = 5;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { expenses, total } = await getExpensesPaginated(
          currentPage,
          itemsPerPage,
          search,
          filters
        );

        const formatted = expenses.map((e: any) => ({
          ...e,
          by: e.user?.name || "Unknown",
        }));

        setData(formatted);
        setTotalItems(total);
      } catch (error) {
        toast.error("Failed to fetch expenses");
        console.error("Error fetching expenses:", error);
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

  const handleDelete = async (expense: Expense) => {
    if (!expense._id) return;

    toast.promise(
      async () => {
        const response = await deleteExpense(expense._id!);
        if (!response?.success) {
          throw new Error(response?.error || "Failed to delete expense");
        }
        setData((prev) => prev.filter((item) => item._id !== expense._id));
        setTotalItems((prev) => prev - 1);
        return `Expense ${expense.name} deleted successfully`;
      },
      {
        loading: "Deleting expense...",
        success: (message) => message,
        error: (error) => error.message || "Delete failed",
      }
    );
  };

  const handleEdit = (expense: Expense) => {
    setEditExpense(expense);
    setPopUp(true);
  };

  const resetPopupState = () => {
    setPopUp(false);
    setEditExpense(null);
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />
      <ContentNavbar
        filters={["active", "amount", "date"]}
        setSearch={handleSearchChange}
        setPopUp={() => {
          setEditExpense(null);
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
        <ExpensesPopup
          editUser={editExpense}
          setEdit={setEditExpense}
          setPopUp={setPopUp}
          setData={setData}
        />
      </Popup>
    </div>
  );
}

export default Expenses;
