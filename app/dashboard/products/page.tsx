"use client";

import ContentNavbar from "@/components/layout/ContentNavbar";
import CustomTable from "@/components/custom-table";
import Popup from "@/components/Popup";
import ProductsPopup from "@/components/popups/ProductsPopup";
import { Column } from "@/types/Column";
import React, { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { useFilterStore } from "@/lib/store/useFilter";
import { getProduct, deleteProduct } from "@/lib/actions/productsActions";
import { Trash2, Pencil, Eye, File } from "lucide-react";
import { redirect } from "next/navigation";
import ActiveFilterBar from "@/components/ActiveFilterBar";

function Products() {
  const [popUp, setPopUp] = useState(false);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [editProduct, setEditProduct] = useState<any>(null);
  const { filters } = useFilterStore();

  const columns: Column[] = [
    { key: "prod_id", label: "ID", type: "text" },
    { key: "barcode_id", label: "Barcode", type: "text" },
    { key: "name", label: "Name", type: "text" },
    { key: "quantity", label: "Quantity", type: "text" },
    { key: "isActive", label: "Status", type: "status" },
    { key: "categoryName", label: "Category", type: "text" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const products = await getProduct();
        console.log(products);
        setData(products);
      } catch (error) {
        toast.error("Failed to fetch products");
        console.error("Error fetching products:", error);
      }
    }

    fetchData();
  }, [filters]);

  const handleDelete = async (product: any) => {
    if (!product._id) return;

    toast.promise(
      async () => {
        const response = await deleteProduct(product._id);
        if (!response?.success) {
          throw new Error(response?.error || "Failed to delete product");
        }
        setData((prev) => prev.filter((item) => item._id !== product._id));
        return `Product ${product.name} deleted successfully`;
      },
      {
        loading: "Deleting product...",
        success: (message) => message,
        error: (error) => error.message || "Delete failed",
      }
    );
  };

  const handleEdit = (product: any) => {
    setEditProduct(product);
    setPopUp(true);
  };

  const resetPopupState = () => {
    setPopUp(false);
    setEditProduct(null);
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster richColors />
      <ContentNavbar
        setSearch={setSearch}
        setPopUp={() => {
          setEditProduct(null);
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
              label: "Lots",
              icon: <File className="h-4 w-4" />,
              onClick: (product) => {
                redirect("/dashboard/lots/" + product._id);
              },
            },
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
        <ProductsPopup
          setData={setData}
          setPopUp={setPopUp}
          editProduct={editProduct}
          setEditProduct={setEditProduct}
        />
      </Popup>
    </div>
  );
}

export default Products;
