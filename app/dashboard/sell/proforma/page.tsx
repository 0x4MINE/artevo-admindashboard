"use client";

import CustomTable from "@/components/custom-table";
import ContentNavbar from "@/components/layout/ContentNavbar";
import SelectClient from "@/components/select/selectClient";
import { deleteProforma, getProformas } from "@/lib/actions/transactionActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { formatBillNo } from "@/lib/utils";
import { Column } from "@/types/Column";
import { Eye, Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

function Proforma() {
  const columns: Column[] = [
    { key: "sell_id", label: "ID", type: "text" },
    { key: "date", label: "Date", type: "date" },
    { key: "client_name", label: "Client", type: "text" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "by", label: "By", type: "text" },
  ];

  const [clientPopUp, setClientPopUp] = useState(false);
  const [proformaData, setProformaData] = useState<any[]>([]);
  const { filters } = useFilterStore();
  const [search, setSearch] = useState("");
  const router = useRouter();
  const resetPopupState = () => {
    setClientPopUp(false);
  };
  const handleClientSelect = (client: any) => {
    redirect("/dashboard/sell/proforma/details?client_id=" + client.client_id);
  };
  useEffect(() => {
    async function fetchData() {
      try {
        const proformas = await getProformas();
        console.log(proformas);
        setProformaData(
          proformas.map((p) => ({
            ...p,
            sell_id: formatBillNo(p.sell_id),
          }))
        );
      } catch (error) {
        toast.error("Failed to fetch data");
        console.error("Error fetching data:", error);
      }
    }
    fetchData();
  }, [filters]);

  return (
    <div>
      <Toaster richColors />
      <ContentNavbar setSearch={setSearch} setPopUp={setClientPopUp} />
      <div className="p-8">
        <CustomTable
          searchTerm={search}
          data={proformaData}
          columns={columns}
          showActions={true}
          actions={[
            {
              label: "View",
              icon: <Eye className="h-4 w-4" />,
              onClick: (proforma) => {
                window.open(
                  "/api/proforma?proformaId=" + proforma._id,
                  "_blank"
                );
              },
            },
            {
              label: "Delete",
              icon: <Eye className="h-4 w-4" />,
              variant: "destructive",
              onClick: (proforma) => {
                deleteProforma(proforma._id);
              },
            },
          ]}
        />
      </div>
      <SelectClient
        isOpen={clientPopUp}
        onClose={resetPopupState}
        onSelect={handleClientSelect}
      />
    </div>
  );
}

export default Proforma;
