"use client";
import { useEffect, useState } from "react";
import CustomTable from "@/components/custom-table";
import ContentNavbar from "@/components/layout/ContentNavbar";
import Popup from "@/components/Popup";
import { useFilterStore } from "@/lib/store/useFilter";
import { Column } from "@/types/Column";
import { toast, Toaster } from "sonner";
import { Pencil } from "lucide-react";
import { getSupplierPayms } from "@/lib/actions/supplierPaymActions";
import SupplierPaymentPopup from "@/components/popups/supplierPaymentPopup";

function Payment() {
  const columns: Column[] = [
    { key: "supplierPay_id", label: "ID", type: "text" },
    { key: "date", label: "Date", type: "date" },
    { key: "supplier_name", label: "Supplier", type: "text" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "by", label: "By", type: "text" },
  ];

  const [data, setData] = useState<any[]>([]);
  const { filters } = useFilterStore();
  const [search, setSearch] = useState("");
  const [PopUp, setPopUp] = useState(false);
  const [editPayment, setEditPayment] = useState<any>();

  const resetPopupState = () => {
    setPopUp(false);
    setEditPayment(undefined);
  };
  const handleEdit = (product: any) => {
    setEditPayment(product);
    setPopUp(true);
  };
  useEffect(() => {
    (async () => {
      try {
        const payments = await getSupplierPayms();
        console.log(payments);
        setData(payments);
      } catch (error) {
        console.error("Error loading payments:", error);
        toast.error("Failed to load payments");
      }
    })();
  }, []);

  return (
    <div>
      <Toaster richColors />
      <ContentNavbar setSearch={setSearch} setPopUp={setPopUp} />
      <div className="p-8">
        <CustomTable
          data={data}
          columns={columns}
          showActions={true}
          searchTerm={search}
          actions={[
            {
              label: "Edit",
              icon: <Pencil className="h-4 w-4" />,
              onClick: handleEdit,
            },
          ]}
        />
      </div>
      <Popup isOpen={PopUp} onClose={resetPopupState}>
        <SupplierPaymentPopup
          setEditPayment={setEditPayment}
          editPayment={editPayment}
          setData={setData}
          setPopUp={setPopUp}
        />
      </Popup>
    </div>
  );
}

export default Payment;
