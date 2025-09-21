"use client";

import ActiveFilterBar from "@/components/ActiveFilterBar";
import CustomTable from "@/components/custom-table";
import ContentNavbar from "@/components/layout/ContentNavbar";
import Loader from "@/components/layout/Loader";
import Popup from "@/components/Popup";
import ProductsPopup from "@/components/popups/ProductsPopup";
import { getPaginatedProducts, deleteProduct } from "@/lib/actions/productsActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { Column } from "@/types/Column";
import { Toaster, toast } from "sonner";
import { File, Pencil, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";
import React, { useEffect, useState } from "react";

function Products() {
  const { filters } = useFilterStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [popUp, setPopUp] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const itemsPerPage = 5;

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
        setLoading(true);
        const { products, total } = await getPaginatedProducts(
          currentPage,
          itemsPerPage,
          search,
          filters
        );
        setData(products);
        
        setTotalItems(total);
      } catch (error) {
        toast.error("Failed to fetch products");
        console.error("Error fetching products:", error);
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
        filters={["active", "quantity"]}
        setSearch={handleSearchChange}
        setPopUp={() => {
          setEditProduct(null);
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
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
          />
        )}
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
