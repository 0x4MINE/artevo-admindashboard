"use client";

import React, { use, useEffect, useState } from "react";
import CustomTable from "@/components/custom-table";
import ContentNavbar from "@/components/layout/ContentNavbar";
import Popup from "@/components/Popup";
import LotPopup from "@/components/popups/LotsPopup";
import { getLotsByProductId } from "@/lib/actions/lotActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { Column } from "@/types/Column";
import { toast, Toaster } from "sonner";
import { Pencil } from "lucide-react";
import ActiveFilterBar from "@/components/ActiveFilterBar";

function Lot({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);

  const [popUp, setPopUp] = useState(false);
  const [search, setSearch] = useState("");
  const [editLot, setEditLot] = useState(null);
  const [data, setData] = useState([]);
  const { filters } = useFilterStore();

  const resetPopupState = () => {
    setPopUp(false);
    setEditLot(null);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const lots = await getLotsByProductId(productId);
        console.log(lots);
        setData(lots);
      } catch (error) {
        toast.error("Failed to fetch lots");
        console.error("Error fetching lots:", error);
      }
    }

    fetchData();
  }, [productId, filters]);

  const columns: Column[] = [
    { key: "lot_id", label: "ID", type: "text" },
    { key: "date", label: "Date", type: "date" },
    { key: "buyPrice", label: "Buy Price", type: "currency" },
    { key: "sellPrice", label: "Sell Price", type: "currency" },
    { key: "isActive", label: "Status", type: "status" },
    { key: "quantity", label: "Quantity", type: "text" },
    { key: "supp_name", label: "Supplier", type: "text" },
  ];

  const handleEdit = (lot: any) => {
    console.log(lot);
    setEditLot(lot);
    setPopUp(true);
  };
  return (
    <div>
      <Toaster richColors />
      <ContentNavbar filters={["active"]} setPopUp={setPopUp} setSearch={setSearch} />
      <div className="p-8">
        {" "}
        <ActiveFilterBar filteredData={data} />
        <CustomTable
          data={data ?? []}
          columns={columns}
          actions={[
            {
              label: "Edit",
              icon: <Pencil className="h-4 w-4" />,
              onClick: handleEdit,
            },
          ]}
        />
      </div>
      <Popup isOpen={popUp} onClose={resetPopupState}>
        <LotPopup
          setPopUp={setPopUp}
          setData={setData}
          productId={productId}
          editLot={editLot}
          setEditLot={setEditLot}
        />
      </Popup>
    </div>
  );
}

export default Lot;
