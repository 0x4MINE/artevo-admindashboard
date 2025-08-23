"use client";

import ContentNavbar from "@/components/layout/ContentNavbar";
import CustomTable from "@/components/custom-table";
import Popup from "@/components/Popup";
import CategoriesPopup from "@/components/popups/CategoriesPopup";
import UsersPopup from "@/components/popups/UsersPopup";
import { Column } from "@/types/Column";
import FilterState from "@/types/FilterState";
import React, { use, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { deleteUser, getUsers } from "@/lib/actions/userActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { Copy, Edit, Eye, Trash2 } from "lucide-react";
function Users() {
  const [popUp, setPopUp] = useState(false);
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [editUser, setEditUser] = useState(null);

  const { filters } = useFilterStore();
  const columns: Column[] = [
    { key: "id", label: "ID", type: "text" },
    { key: "name", label: "Name", type: "text" },
    { key: "createdAt", label: "Reg Date", type: "date" },
    { key: "isActive", label: "Status", type: "status" },
    { key: "role", label: "Role", type: "text" },
  ];

  useEffect(() => {
    async function fetchData() {
      const users = await getUsers();
      console.log(users);
      setData(users);
    }

    fetchData();
  }, [filters]);

  const handleDelete = async (item: any) => {
    const { _id, id } = item;
    toast.promise(
      async () => {
        const response = await deleteUser(_id);

        if (!response.success) throw new Error(response.error);
        setData([...data].filter((element) => element._id !== _id));

        return `User ${id} has been deleted`;
      },
      {
        loading: "Deleting user...",
        success: (msg) => msg,
        error: "Failed to add user",
      }
    );
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />
      <ContentNavbar setSearch={setSearch} setPopUp={setPopUp} />
      <div className="p-8">
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
                setEditUser(item);
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
          setEditUser(null);
        }}
      >
        <UsersPopup
          setData={setData}
          setPopUp={setPopUp}
          editUser={editUser}
          setEditUser={setEditUser}
        />
      </Popup>
    </div>
  );
}

export default Users;
