"use client";

import CustomTable from "@/components/custom-table";
import SuccessPopup from "@/components/popups/SuccessPopup";
import PayPopup from "@/components/popups/PayPopup";
import SelectLot from "@/components/select/selectLot";
import SelectProduct from "@/components/select/selectProduct";
import SelectService from "@/components/select/selectService";
import SelectSupplier from "@/components/select/selectSupplier";
import { Column } from "@/types/Column";
import { Calendar, RefreshCcw } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import {
  getNextNumber,
  createBuyTransaction,
} from "@/lib/actions/transactionActions";
import { useUserStore } from "@/lib/store/useUser";
import { toast, Toaster } from "sonner";
import { BASEURL } from "@/constants/auth";
import { getSupplierById } from "@/lib/actions/supplierActions";
import AddTextInput from "@/components/forms/AddTextInput";
import NewBtn from "@/components/forms/NewBtn";

function Details() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supp_id = searchParams.get("supp_id");
  const { user } = useUserStore();

  const [billNo, setBillNo] = useState<string>("...");
  const [billDate, setBillDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [supplier, setSupplier] = useState<any>({});
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [savedTransactionId, setSavedTransactionId] = useState<string | null>(
    null
  );
  const [savedBuyFactId, setSavedBuyFactId] = useState<number | null>(null);
  const [originalBill, setOriginalBill] = useState("");

  // Popups
  const [productPopup, setProductPopup] = useState(false);
  const [servicePopup, setServicePopup] = useState(false);
  const [lotPopup, setLotPopup] = useState(false);
  const [supplierPopup, setSupplierPopup] = useState(false);
  const [payPopup, setPayPopup] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Columns
  const pColumns: Column[] = [
    { key: "prod_id", label: "Product ID", type: "text" },
    { key: "prod_name", label: "Product Name", type: "text" },
    { key: "lot_id", label: "Lot ID", type: "text" },
    { key: "buyPrice", label: "Buy Price", type: "currency", editable: true },
    { key: "sellPrice", label: "Sell Price", type: "currency", editable: true },
    { key: "quantity", label: "Quantity", type: "text", editable: true },
  ];

  const sColumns: Column[] = [
    { key: "serv_id", label: "ID", type: "text" },
    { key: "name", label: "Name", type: "text" },
    { key: "buyPrice", label: "Buy Price", type: "currency", editable: true },
    { key: "tva", label: "TVA", type: "text" },
  ];

  // Totals
  const total = useMemo(() => {
    const productTotal = products.reduce(
      (sum, p) => sum + (Number(p.buyPrice) || 0) * (Number(p.quantity) || 0),
      0
    );
    const serviceTotal = services.reduce(
      (sum, s) => sum + (Number(s.buyPrice) || 0),
      0
    );
    return productTotal + serviceTotal;
  }, [products, services]);

  const formattedDate = useMemo(() => {
    const date = new Date(billDate);
    return date.toLocaleDateString("en-GB");
  }, [billDate]);

  // Load supplier when supp_id changes
  useEffect(() => {
    if (!supp_id) return;
    (async () => {
      try {
        const supplierData = await getSupplierById(supp_id);
        setSupplier(supplierData);
      } catch (error) {
        console.error("Error loading supplier:", error);
        toast.error("Failed to load supplier");
      }
    })();
  }, [supp_id]);

  // Generate bill number on mount
  useEffect(() => {
    (async () => {
      try {
        const next = await getNextNumber("buyFactId");
        setBillNo(next);
      } catch (err) {
        console.error("Failed to fetch bill number", err);
        setBillNo("N/A");
        toast.error("Failed to generate bill number");
      }
    })();
  }, []);

  const handleSupplierSelect = (selectedSupplier: any) => {
    setSupplier(selectedSupplier);
    const params = new URLSearchParams(searchParams);
    params.set("supp_id", selectedSupplier.supp_id || selectedSupplier._id);
    router.push(`?${params.toString()}`);
  };

  const handleSave = async () => {
    try {
      if (!supplier?.supp_id && !supplier?._id) {
        toast.error("Please select a supplier");
        return;
      }

      if (products.length === 0 && services.length === 0) {
        toast.error("Please add at least one product or service");
        return;
      }

      if (!user?.id) {
        toast.error("User session not found. Please login again.");
        return;
      }

      // Validate products
      const invalidProducts = products.filter(
        (p) =>
          !p.prod_name ||
          !p.quantity ||
          !p.buyPrice ||
          p.quantity <= 0 ||
          p.buyPrice <= 0
      );
      if (invalidProducts.length > 0) {
        toast.error(
          "Please ensure all products have valid name, quantity, and buy price"
        );
        return;
      }

      // Validate services
      const invalidServices = services.filter(
        (s) => !s.name || !s.buyPrice || s.buyPrice <= 0
      );
      if (invalidServices.length > 0) {
        toast.error("Please ensure all services have valid name and buy price");
        return;
      }
      console.log(products);
      const transactionData = {
        date: billDate,
        userId: user.id,
        suppId: supplier._id || supplier.supp_id,
        reglement: paymentMethod,
        originalCode: originalBill || undefined,
        type: "purchase" as const,
        products: products.map((product) => ({
          lot_id: product._id,
          prod_name: product.prod_name,
          prod_oid: product.prod_oid,
          quantity: Number(product.quantity),
          sellPrice: Number(product.sellPrice) || 0,
          buyPrice: Number(product.buyPrice),
        })),
        services: services.map((service) => ({
          name: service.name,
          buyPrice: Number(service.buyPrice),
        })),
      };

      const result = await createBuyTransaction(transactionData);

      if (!result.success) {
        throw new Error(result.error);
      }

      setSavedTransactionId(result._id);
      setSavedBuyFactId(result.buyFactId);
      toast.success(
        result.message || "Purchase transaction saved successfully"
      );
      setSuccessPopup(true);
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      toast.error(error.message || "Failed to save transaction");
    }
  };

  const handleCancel = () => {
    setProducts([]);
    setServices([]);
    setOriginalBill("");
    setSavedTransactionId(null);
    setSavedBuyFactId(null);
    toast.info("Transaction cancelled");
  };

  const handleNewTransaction = async () => {
    setProducts([]);
    setServices([]);
    setOriginalBill("");
    setSavedTransactionId(null);
    setSavedBuyFactId(null);
    setSuccessPopup(false);

    try {
      const next = await getNextNumber("buyFactId");
      setBillNo(next);
    } catch (err) {
      console.error("Failed to fetch new bill number", err);
      toast.error("Failed to generate new bill number");
    }
  };

  return (
    <div>
      <Toaster richColors />

      {/* Buttons */}
      <div className="btns flex gap-2 justify-end">
        <NewBtn text="ADD PRODUCT" onClick={() => setProductPopup(true)} />
        <NewBtn text="ADD SERVICE" onClick={() => setServicePopup(true)} />
      </div>

      {/* Bill Info */}
      <div className="card flex justify-between bg-primary px-16 py-8 m-8 rounded-2xl">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <p>Original Bill No:</p>
            <AddTextInput
              value={originalBill}
              onChange={(e) => setOriginalBill(e.target.value)}
              placeholder="..."
              className="p-0 size-0.5 max-w-[10rem]"
            />
          </div>
          <p>Bon No: {billNo}</p>
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
          <p>
            Payment Method:{" "}
            <span className="font-semibold">{paymentMethod}</span>
            <button
              onClick={() => setPayPopup(true)}
              className="ml-2 text-btn-primary hover:underline"
            >
              Change
            </button>
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2">
            Supplier : {supplier?.name ?? supp_id ?? "Not Selected"}
            <RefreshCcw
              className="bg-btn-primary text-white p-1 rounded-[6px] cursor-pointer hover:opacity-80"
              size={25}
              onClick={() => setSupplierPopup(true)}
            />
          </p>
          <p>Credit : {supplier?.credit || 0.0}</p>
          {savedBuyFactId && (
            <p className="text-green-600 font-semibold">
              Saved Transaction ID: {savedBuyFactId}
            </p>
          )}
        </div>
      </div>

      {/* Products & Services */}
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-2 text-title">Products</h2>
        <CustomTable
          showActions
          data={products}
          columns={pColumns}
          onEdit={(updatedRow, rowIndex) => {
            const updatedProducts = [...products];
            updatedProducts[rowIndex] = {
              ...updatedRow,
              buyPrice: Number(updatedRow.buyPrice),
              sellPrice: Number(updatedRow.sellPrice),
              quantity: Number(updatedRow.quantity),
            };
            setProducts(updatedProducts);
          }}
          onDelete={(rowIndex) => {
            const updatedProducts = products.filter((_, i) => i !== rowIndex);
            setProducts(updatedProducts);
          }}
        />

        <h2 className="text-3xl font-bold mb-2 text-title mt-6">Services</h2>
        <CustomTable
          showActions
          data={services}
          columns={sColumns}
          onEdit={(updatedRow, rowIndex) => {
            const updatedServices = [...services];
            updatedServices[rowIndex] = {
              ...updatedRow,
              buyPrice: Number(updatedRow.buyPrice),
            };
            setServices(updatedServices);
          }}
          onDelete={(rowIndex) => {
            const updatedServices = services.filter((_, i) => i !== rowIndex);
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
            onClick={handleCancel}
            className="bg-transparent text-btn-secondary border border-btn-secondary py-3 px-6 rounded-2xl text-md"
          >
            Cancel
          </button>
          {savedTransactionId && (
            <button
              onClick={handleNewTransaction}
              className="bg-green-600 text-white py-3 px-6 rounded-2xl text-md"
            >
              New Transaction
            </button>
          )}
        </div>
        <div>
          <div className="card bg-secondary rounded-2xl">
            <div className="flex flex-col justify-center items-center px-8 py-4">
              <h1 className="font-medium">Total</h1>
              <p className="text-lg">{total.toLocaleString()} DA</p>
            </div>
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
          const newProduct = {
            ...lot,
            prod_name: lot.prod_id?.name ?? lot.prod_name,
            prod_oid: lot.prod_id?._id,
            prod_id: lot.prod_id?.prod_id,
            quantity: 1,
            buyPrice: lot.buyPrice || 0,
            sellPrice: lot.sellPrice || 0,
          };
          setProducts((prev) => [...prev, newProduct]);
          setLotPopup(false);
        }}
      />
      <SelectService
        isOpen={servicePopup}
        onClose={() => setServicePopup(false)}
        onSelect={(service) => setServices((prev) => [...prev, service])}
      />
      <SelectSupplier
        isOpen={supplierPopup}
        onClose={() => setSupplierPopup(false)}
        onSelect={handleSupplierSelect}
      />
      <PayPopup
        isOpen={payPopup}
        onClose={() => setPayPopup(false)}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />
      <SuccessPopup
        isOpen={successPopup}
        onClose={() => setSuccessPopup(false)}
        onPrintBonLarge={() => {
          if (savedTransactionId) {
            window.open(
              BASEURL + "/api/bon?format=a5&bonId=" + savedTransactionId,
              "_blank"
            );
          }
        }}
        onPrintBonMini={() => {
          if (savedTransactionId) {
            window.open(
              BASEURL + "/api/bon?format=a6&bonId=" + savedTransactionId,
              "_blank"
            );
          }
        }}
        onPrintFacture={() => {
          if (savedTransactionId) {
            window.open(
              BASEURL + "/api/facture?bonId=" + savedTransactionId,
              "_blank"
            );
          }
        }}
        total={total}
        clientName={supplier?.name ?? "Not Selected"}
      />
    </div>
  );
}

export default Details;
