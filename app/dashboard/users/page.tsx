"use client";

import ContentNavbar from "@/components/layout/ContentNavbar";
import CustomTable from "@/components/custom-table";
import Popup from "@/components/Popup";
import UsersPopup from "@/components/popups/UsersPopup";
import { Column } from "@/types/Column";
import { IUser } from "@/lib/models/userModel";
import { toast, Toaster } from "sonner";
import { deleteUser, getUsers } from "@/lib/actions/userActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { Edit, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useUserStore } from "@/lib/store/useUser";

function Users() {
  const [popUp, setPopUp] = useState(false);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<IUser[]>([]);
  const [editUser, setEditUser] = useState<IUser | null>(null);
  const { user } = useUserStore();
  const { filters } = useFilterStore();

  const columns: Column[] = [
    { key: "id", label: "ID", type: "text" },
    { key: "name", label: "Name", type: "text" },
    { key: "createdAt", label: "Reg Date", type: "date" },
    { key: "isActive", label: "Status", type: "status" },
    { key: "role", label: "Role", type: "text" },
  ];

  useEffect(() => {
    (async () => {
      try {
        const users = await getUsers();
        console.log(user);
        setData(users);
      } catch (err) {
        toast.error("Failed to fetch users");
      }
    })();
  }, [filters]);

  const handleDelete = (item: IUser) => {
    toast.promise(
      async () => {
        const { _id, id } = item;
        const response = await deleteUser(_id);

        if (!response.success) throw new Error(response.error);
        setData((prev) => prev.filter((u) => u._id !== _id));

        return `User ${id} deleted`;
      },
      {
        loading: "Deleting user...",
        success: (msg) => msg,
        error: "Failed to delete user",
      }
    );
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />
      <ContentNavbar
        filters={["active"]}
        setSearch={setSearch}
        setPopUp={setPopUp}
      />
      <div className="p-8">
        <CustomTable
          data={data}
          columns={columns}
          searchTerm={search}
          showActions={user?.role === "admin"}
          actions={[
            {
              label: "Edit",
              icon: <Edit className="h-4 w-4" />,
              onClick: (item) => {
                setEditUser(item as IUser);
                setPopUp(true);
              },
            },
            {
              label: "Delete",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: (item) => handleDelete(item as IUser),
              variant: "destructive",
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
