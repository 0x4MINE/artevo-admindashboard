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
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { getClientById } from "@/lib/actions/clientActions";
import { getNextNumber } from "@/lib/actions/transactionActions";
import { useUserStore } from "@/lib/store/useUser";
import { toast, Toaster } from "sonner";
import { BASEURL } from "@/constants/auth";

// Interfaces for better type safety
interface Client {
  client_id: string;
  name: string;
  credit: number;
  email?: string;
  phone?: string;
}

interface Product {
  prod_id: string;
  prod_name: string;
  prod_oid: string;
  lot_id: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  availableStock?: number;
}

interface Service {
  serv_id: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  tva: number;
}

interface SellBonData {
  products: Product[];
  services: Service[];
  client: Client;
  total: number;
  billDate: string;
  billNo: string;
  userId: string;
  giveBonus: boolean;
  bonusPercent: number;
  paymentMethod: string;
}

function SellTransactionDetails() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const client_id = searchParams.get("client_id");
  const { user } = useUserStore();

  const [billNo, setBillNo] = useState<string>("...");
  const [billDate, setBillDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(false);

  const [client, setClient] = useState<Client | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [bonId, setBonId] = useState<string | null>(null);
  const [giveBonus, setGiveBonus] = useState(false);
  const [bonusPercent, setBonusPercent] = useState(15);

  // Popups
  const [productPopup, setProductPopup] = useState(false);
  const [servicePopup, setServicePopup] = useState(false);
  const [lotPopup, setLotPopup] = useState(false);
  const [clientPopup, setClientPopup] = useState(false);
  const [payPopup, setPayPopup] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Columns for sell transactions
  const pColumns: Column[] = [
    { key: "prod_id", label: "Product ID", type: "text" },
    { key: "prod_name", label: "Product Name", type: "text" },
    { key: "lot_id", label: "Lot ID", type: "text" },
    { key: "buyPrice", label: "Cost Price", type: "currency" },
    { key: "sellPrice", label: "Sell Price", type: "currency", editable: true },
    { key: "quantity", label: "Quantity", type: "text", editable: true },
    { key: "availableStock", label: "In Stock", type: "text" },
  ];

  const sColumns: Column[] = [
    { key: "serv_id", label: "Service ID", type: "text" },
    { key: "name", label: "Service Name", type: "text" },
    { key: "buyPrice", label: "Cost Price", type: "currency" },
    { key: "sellPrice", label: "Sell Price", type: "currency", editable: true },
    { key: "tva", label: "TVA (%)", type: "text" },
  ];

  const calculations = useMemo(() => {
    const productSubtotal = products.reduce(
      (sum, p) => sum + (Number(p.sellPrice) || 0) * (Number(p.quantity) || 0),
      0
    );
    const serviceSubtotal = services.reduce(
      (sum, s) => sum + (Number(s.sellPrice) || 0),
      0
    );

    const subtotal = productSubtotal + serviceSubtotal;
    const bonusAmount = giveBonus ? (subtotal * bonusPercent) / 100 : 0;
    const total = subtotal - bonusAmount;

    const productProfit = products.reduce(
      (sum, p) =>
        sum +
        ((Number(p.sellPrice) || 0) - (Number(p.buyPrice) || 0)) *
          (Number(p.quantity) || 0),
      0
    );
    const serviceProfit = services.reduce(
      (sum, s) =>
        sum + ((Number(s.sellPrice) || 0) - (Number(s.buyPrice) || 0)),
      0
    );
    const totalProfit = productProfit + serviceProfit - bonusAmount;

    return {
      subtotal,
      bonusAmount,
      total,
      totalProfit,
    };
  }, [products, services, giveBonus, bonusPercent]);

  const formattedDate = useMemo(() => {
    const date = new Date(billDate);
    return date.toLocaleDateString("en-GB");
  }, [billDate]);

  // Load client data
  useEffect(() => {
    if (!client_id) return;

    const loadClient = async () => {
      try {
        setIsLoading(true);
        const c = await getClientById(client_id);
        setClient(c);
      } catch (error) {
        console.error("Failed to load client:", error);
        toast.error("Failed to load client data");
      } finally {
        setIsLoading(false);
      }
    };

    loadClient();
  }, [client_id]);

  // Load bill number for sell transactions
  useEffect(() => {
    const fetchBillNo = async () => {
      try {
        const next = await getNextNumber("sellBonId");
        setBillNo(next);
      } catch (err) {
        console.error("Failed to fetch sell bill number", err);
        setBillNo("SELL-N/A");
        toast.error("Failed to generate bill number");
      }
    };

    fetchBillNo();
  }, []);

  const handleClientSelect = useCallback(
    (selectedClient: Client) => {
      setClient(selectedClient);
      const params = new URLSearchParams(searchParams);
      params.set("client_id", selectedClient.client_id);
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  const validateStock = useCallback((products: Product[]): boolean => {
    for (const product of products) {
      if (
        product.availableStock &&
        Number(product.quantity) > product.availableStock
      ) {
        toast.error(
          `Insufficient stock for ${product.prod_name}. Available: ${product.availableStock}`
        );
        return false;
      }
    }
    return true;
  }, []);

  const handleSave = useCallback(async () => {
    if (!client) {
      toast.error("Please select a client");
      return;
    }

    if (products.length === 0 && services.length === 0) {
      toast.error("Please add at least one product or service");
      return;
    }

    // Validate stock for sell transactions
    if (!validateStock(products)) {
      return;
    }

    if (!user?.id) {
      toast.error("User session expired. Please login again.");
      return;
    }

    try {
      setIsLoading(true);
      const sellBonData: SellBonData = {
        products,
        services,
        client,
        total: calculations.total,
        billDate,
        billNo,
        userId: user.id,
        giveBonus,
        bonusPercent,
        paymentMethod,
      };

      console.log({ sellBonData });
      const res = await fetch("/api/sell-bon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sellBonData),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to save Sell Bon");
      }

      setBonId(data.bonId);
      setSuccessPopup(true);
      toast.success("Sell transaction saved successfully");
    } catch (error: any) {
      console.error("Error saving Sell Bon:", error);
      toast.error(error.message || "Unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [
    client,
    products,
    services,
    calculations.total,
    billDate,
    billNo,
    user?.id,
    giveBonus,
    bonusPercent,
    paymentMethod,
    validateStock,
  ]);

  // Print Facture/Invoice from Sell Bon
  const handlePrintFacture = useCallback(async () => {
    if (!bonId) {
      toast.error("Save the transaction first before creating Invoice");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`/api/sell-facture?bonId=${bonId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate Invoice");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Clean up the URL object
      setTimeout(() => window.URL.revokeObjectURL(url), 100);

      toast.success("Invoice generated successfully");
    } catch (error: any) {
      console.error("❌ Error generating Invoice:", error);
      toast.error(error.message || "Failed to create Invoice");
    } finally {
      setIsLoading(false);
    }
  }, [bonId]);

  const handleCancel = useCallback(() => {
    if (products.length > 0 || services.length > 0) {
      if (!confirm("Are you sure you want to cancel? All data will be lost.")) {
        return;
      }
    }
    setProducts([]);
    setServices([]);
    setBonId(null);
    setGiveBonus(false);
    setBonusPercent(5);
  }, [products.length, services.length]);

  const handleProductEdit = useCallback(
    (updatedRow: Product, rowIndex: number) => {
      setProducts((prev) => {
        const updated = [...prev];
        const updatedProduct = {
          ...updatedRow,
          sellPrice: Number(updatedRow.sellPrice) || 0,
          quantity: Number(updatedRow.quantity) || 0,
        };

        // Validate stock on quantity change
        if (
          updatedProduct.availableStock &&
          updatedProduct.quantity > updatedProduct.availableStock
        ) {
          toast.warning(
            `Quantity exceeds available stock (${updatedProduct.availableStock})`
          );
        }

        updated[rowIndex] = updatedProduct;
        return updated;
      });
    },
    []
  );

  const handleServiceEdit = useCallback(
    (updatedRow: Service, rowIndex: number) => {
      setServices((prev) => {
        const updated = [...prev];
        updated[rowIndex] = {
          ...updatedRow,
          sellPrice: Number(updatedRow.sellPrice) || 0,
        };
        return updated;
      });
    },
    []
  );

  return (
    <div>
      <Toaster richColors />

      {/* Header Buttons */}
      <div className="btns flex justify-end">
        <button
          className="bg-btn-primary text-white py-3 px-2 rounded-2xl text-md hover:opacity-90 disabled:opacity-50"
          onClick={() => setProductPopup(true)}
          disabled={isLoading}
        >
          <span className="font-bold">+</span> ADD PRODUCT
        </button>
        <button
          className="bg-btn-primary mx-2 text-white py-3 px-2 rounded-2xl text-md hover:opacity-90 disabled:opacity-50"
          onClick={() => setServicePopup(true)}
          disabled={isLoading}
        >
          <span className="font-bold">+</span> ADD SERVICE
        </button>
      </div>

      {/* Bill Information Card */}
      <div className="card flex justify-between bg-primary px-16 py-8 m-8 rounded-2xl">
        <div className="flex flex-col gap-2">
          <p>
            Invoice No: <span className="font-semibold">{billNo}</span>
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="billDate">Date :</label>
            <div className="relative">
              <input
                type="date"
                id="billDate"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                disabled={isLoading}
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
          <p>
            Payment Method:{" "}
            <span className="font-semibold">{paymentMethod}</span>
          </p>
        </div>
        <div>
          <p className="flex items-center gap-2">
            Client :{" "}
            <span className="font-semibold">
              {client?.name ?? (client_id || "Not selected")}
            </span>
            <RefreshCcw
              className="bg-btn-primary text-white p-1 rounded-[6px] cursor-pointer hover:opacity-80"
              size={25}
              onClick={() => setClientPopup(true)}
              style={{
                opacity: isLoading ? 0.5 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            />
          </p>
          <p>
            Client Credit :{" "}
            <span className="font-semibold">
              {client?.credit?.toLocaleString() || "0.00"} DA
            </span>
          </p>
          <p>
            Bonus Percent :{" "}
            <span className="font-semibold text-green-600">
              {giveBonus ? `${bonusPercent}%` : "0%"}
            </span>
          </p>
          <p>
            Bonus Amount :{" "}
            <span className="font-semibold text-green-600">
              {calculations.bonusAmount.toLocaleString()} DA
            </span>
          </p>
          <p>
            Expected Profit :{" "}
            <span
              className={`font-semibold ${
                calculations.totalProfit >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {calculations.totalProfit.toLocaleString()} DA
            </span>
          </p>
        </div>
      </div>

      {/* Products & Services Tables */}
      <div className="p-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold text-title">Products for Sale</h2>
          <span className="text-sm text-gray-600">
            {products.length} item{products.length !== 1 ? "s" : ""}
          </span>
        </div>
        <CustomTable
          showActions={false}
          data={products}
          columns={pColumns}
          onEdit={handleProductEdit}
        />

        <div className="flex items-center justify-between mb-2 mt-6">
          <h2 className="text-3xl font-bold text-title">Services</h2>
          <span className="text-sm text-gray-600">
            {services.length} service{services.length !== 1 ? "s" : ""}
          </span>
        </div>
        <CustomTable
          showActions={false}
          data={services}
          columns={sColumns}
          onEdit={handleServiceEdit}
        />
      </div>

      {/* Footer with Actions and Totals */}
      <div className="flex justify-between items-center px-8 py-4">
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-btn-primary text-white py-3 px-8 rounded-2xl text-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Save Sale"}
          </button>

          <button
            onClick={() => setPayPopup(true)}
            disabled={isLoading}
            className="bg-blue-600 text-white py-3 px-6 rounded-2xl text-md hover:opacity-90 disabled:opacity-50"
          >
            Payment
          </button>

          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="bg-transparent text-btn-secondary border border-btn-secondary py-3 px-6 rounded-2xl text-md hover:bg-btn-secondary hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <div>
          <div className="card bg-secondary rounded-2xl mb-2">
            <div className="flex flex-col justify-center items-center px-8 py-4">
              <h1 className="font-medium">Final Total</h1>
              <p className="text-lg font-bold">
                {calculations.total.toLocaleString()} DA
              </p>
              {calculations.subtotal !== calculations.total && (
                <p className="text-sm text-gray-600">
                  Subtotal: {calculations.subtotal.toLocaleString()} DA
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-center items-center gap-3">
            <p>Give Bonus</p>
            <Switch
              checked={giveBonus}
              onCheckedChange={setGiveBonus}
              disabled={isLoading}
            />
            {giveBonus && (
              <input
                type="number"
                value={bonusPercent}
                onChange={(e) => setBonusPercent(Number(e.target.value) || 0)}
                className="w-16 px-2 py-1 border rounded"
                min="0"
                max="100"
                disabled={isLoading}
              />
            )}
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
              tva: lot.prod_id.tva || 0,
              prod_name: lot.prod_id.name,
              prod_oid: lot.prod_id._id,
              prod_id: lot.prod_id.prod_id,
              availableStock: lot.quantity || 0,
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
          console.log(service);
          setServices((prev) => [...prev, service]);
        }}
      />
      <SelectClient
        isOpen={clientPopup}
        onClose={() => setClientPopup(false)}
        onSelect={handleClientSelect}
      />

      <SuccessPopup
        isOpen={successPopup}
        onClose={() => setSuccessPopup(false)}
        onPrintBonLarge={() => {
          window.open(
            `${BASEURL}/api/sell-bon?format=a5&bonId=${bonId}`,
            "_blank"
          );
        }}
        onPrintBonMini={() => {
          window.open(
            `${BASEURL}/api/sell-bon?format=a6&bonId=${bonId}`,
            "_blank"
          );
        }}
        onPrintFacture={() => {
          window.open(
            `${BASEURL}/api/sell-facture?format=a6&bonId=${bonId}`,
            "_blank"
          );        }}
        total={calculations.total}
        clientName={client?.name || ""}
      />
            <PayPopup
        isOpen={payPopup}
        onClose={() => setPayPopup(false)}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />
    </div>
  );
}

export default SellTransactionDetails;
