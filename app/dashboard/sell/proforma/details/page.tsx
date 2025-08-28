"use client";

import CustomTable from "@/components/custom-table";
import SuccessPopup from "@/components/popups/SuccessPopup";
import PayPopup from "@/components/popups/PayPopup";
import SelectLot from "@/components/select/selectLot";
import SelectProduct from "@/components/select/selectProduct";
import SelectService from "@/components/select/selectService";
import SelectClient from "@/components/select/selectClient";
import { Switch } from "@/components/ui/switch";
import { Column } from "@/types/Column";
import { Calendar, RefreshCcw } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { getClientById } from "@/lib/actions/clientActions";
import { toast, Toaster } from "sonner";
import {
  createProforma,
  getNextNumber,
} from "@/lib/actions/transactionActions";
import { useUserStore } from "@/lib/store/useUser";

function Details() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const client_id = searchParams.get("client_id");
  const { user } = useUserStore();
  const [billNo, setBillNo] = useState<string>("...");
  const [client, setClient] = useState<any>({});
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [billDate, setBillDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Popups
  const [productPopup, setProductPopup] = useState(false);
  const [servicePopup, setServicePopup] = useState(false);
  const [lotPopup, setLotPopup] = useState(false);
  const [payPopup, setPayPopup] = useState(false);
  const [clientPopup, setClientPopup] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const formattedDate = useMemo(() => {
    const date = new Date(billDate);
    return date.toLocaleDateString("en-GB");
  }, [billDate]);

  const pColumns: Column[] = [
    { key: "prod_id", label: "Product ID", type: "text" },
    { key: "prod_name", label: "Product Name", type: "text" },
    { key: "lot_id", label: "Lot ID", type: "text" },
    { key: "buyPrice", label: "Buy Price", type: "currency" },
    { key: "sellPrice", label: "Sell Price", type: "currency", editable: true },
    { key: "quantity", label: "Quantity", type: "text", editable: true },
  ];

  const sColumns: Column[] = [
    { key: "serv_id", label: "ID", type: "text" },
    { key: "name", label: "Name", type: "text" },
    { key: "buyPrice", label: "Buy Price", type: "currency" },
    { key: "sellPrice", label: "Sell Price", type: "currency", editable: true },
    { key: "tva", label: "TVA", type: "text" },
  ];

  // Totals
  const total = useMemo(() => {
    const productTotal = products.reduce(
      (sum, p) => sum + (Number(p.sellPrice) || 0) * (Number(p.quantity) || 0),
      0
    );
    const serviceTotal = services.reduce(
      (sum, s) => sum + (Number(s.sellPrice) || 0),
      0
    );
    return productTotal + serviceTotal;
  }, [products, services]);

  useEffect(() => {
    if (!client_id) return;
    (async () => {
      const c = await getClientById(client_id);
      setClient(c);
    })();
  }, [client_id]);

  useEffect(() => {
    async function fetchBillNo() {
      try {
        const next = await getNextNumber("proformaId");
        setBillNo(next);
      } catch (err) {
        console.error("Failed to fetch bill number", err);
        setBillNo("N/A");
      }
    }
    fetchBillNo();
  }, []);
  const handleClientSelect = (selectedClient: any) => {
    setClient(selectedClient);
    const params = new URLSearchParams(searchParams);
    params.set("client_id", selectedClient.client_id);
    router.push(`?${params.toString()}`);
  };

  async function handleSave() {
    try {
      const res = await fetch("/api/proforma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products,
          services,
          client,
          total,
          billDate,
          billNo,
          userId: user?.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate proforma");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      toast.success("Proforma saved successfully");
    } catch (error) {
      console.error("❌ Error generating proforma:", error);
      toast.error("Failed to create proforma");
    }
  }

  return (
    <div>
      <Toaster richColors />
      {/* Header */}
      <div className="btns flex justify-end">
        <button
          className="bg-btn-primary text-white py-3 px-2 rounded-2xl text-md"
          onClick={() => setProductPopup(true)}
        >
          <span className="font-bold">+</span> ADD PRODUCT
        </button>
        <button
          className="bg-btn-primary mx-2 text-white py-3 px-2 rounded-2xl text-md"
          onClick={() => setServicePopup(true)}
        >
          <span className="font-bold">+</span> ADD SERVICE
        </button>
      </div>

      {/* Bill Info */}
      <div className="card flex justify-between bg-primary px-16 py-8 m-8 rounded-2xl">
        <div className="flex flex-col gap-2">
          <p>Bill No: {billNo} </p>
          <div className="flex items-center gap-2">
            <label htmlFor="billDate">Date :</label>
            <div className="relative">
              <input
                type="date"
                id="billDate"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
              <span className="flex items-center gap-2 cursor-pointer">
                {formattedDate}
                <Calendar
                  className="bg-btn-primary text-white p-1 rounded-[6px]"
                  size={25}
                />
              </span>
            </div>
          </div>
        </div>
        <div>
          <p className="flex items-center gap-2">
            Client : {client?.name ?? client_id}
            <RefreshCcw
              className="bg-btn-primary text-white p-1 rounded-[6px] cursor-pointer hover:opacity-80"
              size={25}
              onClick={() => setClientPopup(true)}
            />
          </p>
          <p>Credit : {client?.credit || 0.0}</p>
          <p>Bonus Percent : 0%</p>
          <p>Bonus Amount : 0.00</p>
        </div>
      </div>

      {/* Products */}
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-2 text-title">Products</h2>
        <CustomTable
          showActions={false}
          data={products}
          columns={pColumns}
          onEdit={(updatedRow, rowIndex) => {
            const updatedProducts = [...products];
            updatedProducts[rowIndex] = {
              ...updatedRow,
              sellPrice: Number(updatedRow.sellPrice),
              quantity: Number(updatedRow.quantity),
            };
            setProducts(updatedProducts);
          }}
        />

        <h2 className="text-3xl font-bold mb-2 text-title mt-6">Services</h2>
        <CustomTable
          showActions={false}
          data={services}
          columns={sColumns}
          onEdit={(updatedRow, rowIndex) => {
            const updatedServices = [...services];
            updatedServices[rowIndex] = {
              ...updatedRow,
              sellPrice: Number(updatedRow.sellPrice),
            };
            setServices(updatedServices);
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center px-8 py-4">
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="bg-btn-primary text-white py-3 px-8 rounded-2xl text-md"
          >
            Save
          </button>
          <button
            onClick={() => {
              setProducts([]);
              setServices([]);
            }}
            className="bg-transparent text-btn-secondary border border-btn-secondary py-3 px-6 rounded-2xl text-md"
          >
            Cancel
          </button>
        </div>
        <div>
          <div className="card bg-secondary rounded-2xl">
            <div className="flex flex-col justify-center items-center px-8 py-4">
              <h1 className="font-medium">Total</h1>
              <p className="text-lg">{total.toLocaleString()} DA</p>
            </div>
          </div>
          <div className="flex justify-center items-center gap-3">
            <p>Give Bonus</p>
            <Switch />
          </div>
        </div>
      </div>

      {/* POPUPS */}
      <SelectProduct
        isOpen={productPopup}
        onClose={() => setProductPopup(false)}
        onSelect={(product) => {
          setSelectedProduct(product);
          setProductPopup(false);
          setLotPopup(true);
        }}
      />
      <SelectLot
        isOpen={lotPopup}
        productId={selectedProduct?._id}
        onClose={() => setLotPopup(false)}
        onSelect={(lot) => {
          setProducts((prev) => [
            ...prev,
            {
              ...lot,
              prod_name: lot.prod_id.name,
              prod_oid: lot.prod_id._id,
              prod_id: lot.prod_id.prod_id,
              quantity: 1,
            },
          ]);
          setLotPopup(false);
        }}
      />
      <SelectService
        isOpen={servicePopup}
        onClose={() => setServicePopup(false)}
        onSelect={(service) => {
          setServices((prev) => [...prev, service]);
        }}
      />

      <PayPopup
        isOpen={payPopup}
        onClose={() => setPayPopup(false)}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />
      <SelectClient
        isOpen={clientPopup}
        onClose={() => setClientPopup(false)}
        onSelect={handleClientSelect}
      />
    </div>
  );
}

export default Details;
