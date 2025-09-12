"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Calendar, RefreshCcw, Search } from "lucide-react";
import { toast, Toaster } from "sonner";

import CustomTable from "@/components/custom-table";
import SuccessPopup from "@/components/popups/SuccessPopup";
import PayPopup from "@/components/popups/PayPopup";
import SelectSupplier from "@/components/select/selectSupplier";
import SelectBuyFact from "@/components/select/selectBuyFact";
import AddTextInput from "@/components/forms/AddTextInput";
import NewBtn from "@/components/forms/NewBtn";
import { Column } from "@/types/Column";
import {
  getNextNumber,
  createBuyTransaction,
  getBuyFactById,
} from "@/lib/actions/transactionActions";
import { useUserStore } from "@/lib/store/useUser";
import { BASEURL } from "@/constants/auth";
import { getSupplierById } from "@/lib/actions/supplierActions";

interface ReturnProduct {
  prod_id: string;
  prod_name: string;
  lot_id: string;
  original_quantity: number;
  return_quantity: number;
  buyPrice: number;
  return_reason: string;
  _id?: string;
  prod_oid?: string;
}

interface ReturnService {
  serv_id: string;
  name: string;
  buyPrice: number;
  tva: number;
  return_reason: string;
  _id?: string;
}

export default function ReturnDetails() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUserStore();

  const supp_id = searchParams.get("supp_id");
  const original_bill_id = searchParams.get("original_bill_id");

  const [billNo, setBillNo] = useState<string>("...");
  const [billDate, setBillDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [supplier, setSupplier] = useState<any>({});
  const [originalBill, setOriginalBill] = useState<any>(null);
  const [originalCode, setOriginalCode] = useState("");

  const [returnProducts, setReturnProducts] = useState<ReturnProduct[]>([]);
  const [returnServices, setReturnServices] = useState<ReturnService[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [savedTransactionId, setSavedTransactionId] = useState<string | null>(
    null
  );
  const [savedBuyFactId, setSavedBuyFactId] = useState<number | null>(null);

  const [supplierPopup, setSupplierPopup] = useState(false);
  const [originalBillPopup, setOriginalBillPopup] = useState(false);
  const [payPopup, setPayPopup] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);

  const returnProductColumns: Column[] = [
    { key: "prod_id", label: "Product ID", type: "text" },
    { key: "prod_name", label: "Product Name", type: "text" },
    { key: "lot_id", label: "Lot ID", type: "text" },
    { key: "original_quantity", label: "Original Qty", type: "text" },
    {
      key: "return_quantity",
      label: "Return Qty",
      type: "text",
      editable: true,
    },
    { key: "buyPrice", label: "Buy Price", type: "currency" },
    { key: "return_reason", label: "Reason", type: "text", editable: true },
  ];

  const returnServiceColumns: Column[] = [
    { key: "serv_id", label: "ID", type: "text" },
    { key: "name", label: "Name", type: "text" },
    { key: "buyPrice", label: "Buy Price", type: "currency" },
    { key: "tva", label: "TVA", type: "text" },
    { key: "return_reason", label: "Reason", type: "text", editable: true },
  ];

  const returnTotal = useMemo(() => {
    const productTotal = returnProducts.reduce(
      (sum, p) => sum + (p.buyPrice || 0) * (p.return_quantity || 0),
      0
    );
    const serviceTotal = returnServices.reduce(
      (sum, s) => sum + (s.buyPrice || 0),
      0
    );
    return productTotal + serviceTotal;
  }, [returnProducts, returnServices]);

  const formattedDate = useMemo(() => {
    const date = new Date(billDate);
    return date.toLocaleDateString("en-GB");
  }, [billDate]);

  useEffect(() => {
    if (supp_id) {
      loadSupplier(supp_id);
    }
  }, [supp_id]);

  useEffect(() => {
    generateReturnNumber();
  }, []);

  const loadSupplier = async (supplierId: string) => {
    try {
      const supplierData = await getSupplierById(supplierId);
      setSupplier(supplierData);
    } catch (error) {
      console.error("Error loading supplier:", error);
      toast.error("Failed to load supplier");
    }
  };

  const loadOriginalBill = useCallback(async (billId: string) => {
    try {
      const billData = await getBuyFactById(billId);
      if (billData) {
        setOriginalBill(billData);
        setOriginalCode(billData.buyFactId.toString());
        populateReturnItems(billData);
      }
    } catch (error) {
      console.error("Error loading original bill:", error);
      toast.error("Failed to load original purchase");
    }
  }, []); 

  useEffect(() => {
    if (original_bill_id) {
      loadOriginalBill(original_bill_id);
    }
  }, [original_bill_id, loadOriginalBill]);

  const populateReturnItems = (billData: any) => {
    if (billData.buyDetails) {
      const products = billData.buyDetails
        .filter((detail: any) => detail.type === "product")
        .map((detail: any) => ({
          ...detail,
          original_quantity: detail.quantity,
          return_quantity: 0,
          return_reason: "",
        }));

      const services = billData.buyDetails
        .filter((detail: any) => detail.type === "service")
        .map((detail: any) => ({
          ...detail,
          return_reason: "",
        }));

      setReturnProducts(products);
      setReturnServices(services);
    }
  };

  const generateReturnNumber = async () => {
    try {
      const next = await getNextNumber("buyFactId");
      setBillNo(`R-${next}`);
    } catch (err) {
      console.error("Failed to fetch bill number", err);
      setBillNo("N/A");
      toast.error("Failed to generate return number");
    }
  };

  const handleSupplierSelect = (selectedSupplier: any) => {
    setSupplier(selectedSupplier);
    const params = new URLSearchParams(searchParams);
    params.set("supp_id", selectedSupplier.supp_id || selectedSupplier._id);
    router.push(`?${params.toString()}`);
  };

  const handleOriginalBillSelect = (selectedBill: any) => {
    const params = new URLSearchParams(searchParams);
    params.set("original_bill_id", selectedBill._id);
    router.push(`?${params.toString()}`);
    setOriginalBillPopup(false);
  };

  const handleSave = async () => {
    try {
      if (!validateReturn()) return;

      const transactionData = {
        date: billDate,
        userId: user?.id,
        suppId: supplier._id || supplier.supp_id,
        reglement: paymentMethod,
        originalCode: originalCode,
        type: "return" as const,
        products: returnProducts
          .filter((p) => p.return_quantity > 0)
          .map((product) => ({
            lot_id: product.lot_id || product._id,
            prod_name: product.prod_name,
            prod_oid: product.prod_oid,
            quantity: product.return_quantity,
            buyPrice: product.buyPrice,
            return_reason: product.return_reason || "Return",
          })),
        services: returnServices
          .filter((s) => s.return_reason)
          .map((service) => ({
            name: service.name,
            buyPrice: service.buyPrice,
            return_reason: service.return_reason,
          })),
      };

      const result = await createBuyTransaction(transactionData);

      if (!result.success) {
        throw new Error(result.error);
      }

      setSavedTransactionId(result._id);
      setSavedBuyFactId(result.buyFactId);
      toast.success(result.message || "Return transaction saved successfully");
      setSuccessPopup(true);
    } catch (error: any) {
      console.error("Error saving return:", error);
      toast.error(error.message || "Failed to save return");
    }
  };

  const validateReturn = (): boolean => {
    if (!supplier?.supp_id && !supplier?._id) {
      toast.error("Please select a supplier");
      return false;
    }

    if (!originalCode) {
      toast.error("Please specify the original purchase bill");
      return false;
    }

    const itemsToReturn = [
      ...returnProducts.filter((p) => p.return_quantity > 0),
      ...returnServices.filter((s) => s.return_reason),
    ];

    if (itemsToReturn.length === 0) {
      toast.error("Please specify items to return");
      return false;
    }

    if (!user?.id) {
      toast.error("User session not found. Please login again.");
      return false;
    }

    const invalidProducts = returnProducts.filter(
      (p) => p.return_quantity > p.original_quantity || p.return_quantity < 0
    );

    if (invalidProducts.length > 0) {
      toast.error(
        "Return quantity cannot exceed original quantity or be negative"
      );
      return false;
    }

    return true;
  };

  const handleCancel = () => {
    setReturnProducts([]);
    setReturnServices([]);
    setOriginalCode("");
    setSavedTransactionId(null);
    setSavedBuyFactId(null);
    toast.info("Return cancelled");
  };

  const handleNewReturn = async () => {
    setReturnProducts([]);
    setReturnServices([]);
    setOriginalCode("");
    setSavedTransactionId(null);
    setSavedBuyFactId(null);
    setOriginalBill(null);
    setSuccessPopup(false);

    try {
      const next = await getNextNumber("buyFactId");
      setBillNo(`R-${next}`);
    } catch (err) {
      console.error("Failed to fetch new return number", err);
      toast.error("Failed to generate new return number");
    }
  };

  const updateReturnProduct = (updatedRow: any, rowIndex: number) => {
    const updatedProducts = [...returnProducts];
    updatedProducts[rowIndex] = {
      ...updatedRow,
      return_quantity: Math.min(
        Number(updatedRow.return_quantity) || 0,
        Number(updatedRow.original_quantity) || 0
      ),
    };
    setReturnProducts(updatedProducts);
  };

  const updateReturnService = (updatedRow: any, rowIndex: number) => {
    const updatedServices = [...returnServices];
    updatedServices[rowIndex] = updatedRow;
    setReturnServices(updatedServices);
  };

  const deleteReturnProduct = (rowIndex: number) => {
    setReturnProducts(returnProducts.filter((_, i) => i !== rowIndex));
  };

  const deleteReturnService = (rowIndex: number) => {
    setReturnServices(returnServices.filter((_, i) => i !== rowIndex));
  };

  return (
    <div>
      <Toaster richColors />

      <div className="btns flex gap-2 justify-end">
        <NewBtn
          text="SELECT ORIGINAL BILL"
          onClick={() => setOriginalBillPopup(true)}
        />
      </div>

      <div className="card flex justify-between bg-primary px-16 py-8 m-8 rounded-2xl">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <p>Original Bill No:</p>
            <AddTextInput
              value={originalCode}
              onChange={(e) => setOriginalCode(e.target.value)}
              placeholder="Enter original bill number..."
              className="p-0 size-0.5 max-w-[10rem]"
            />
            <Search
              className="bg-btn-primary text-white p-1 rounded-[6px] cursor-pointer hover:opacity-80"
              size={25}
              onClick={() => setOriginalBillPopup(true)}
            />
          </div>

          {originalBill && (
            <div className="text-sm text-title/75 bg-secondary p-2 rounded">
              <p>
                Original Date:{" "}
                {new Date(originalBill.date).toLocaleDateString()}
              </p>
              <p>Original Total: {originalBill.total?.toLocaleString()} DA</p>
            </div>
          )}

          <p>Return No: {billNo}</p>
          <div className="flex items-center gap-2">
            <label htmlFor="billDate">Return Date:</label>
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
              Saved Return ID: {savedBuyFactId}
            </p>
          )}
        </div>
      </div>

      <div className="p-8">
        <h2 className="text-3xl font-bold mb-2 text-title text-red-600">
          Return Products
        </h2>
        <CustomTable
          showActions
          data={returnProducts}
          columns={returnProductColumns}
          onEdit={updateReturnProduct}
          onDelete={deleteReturnProduct}
        />

        <h2 className="text-3xl font-bold mb-2 text-title text-red-600 mt-6">
          Return Services
        </h2>
        <CustomTable
          showActions
          data={returnServices}
          columns={returnServiceColumns}
          onEdit={updateReturnService}
          onDelete={deleteReturnService}
        />
      </div>

      <div className="flex justify-between items-center px-8 py-4">
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="bg-red-600 text-white py-3 px-8 rounded-2xl text-md"
          >
            Process Return
          </button>
          <button
            onClick={handleCancel}
            className="bg-transparent text-btn-secondary border border-btn-secondary py-3 px-6 rounded-2xl text-md"
          >
            Cancel
          </button>
          {savedTransactionId && (
            <button
              onClick={handleNewReturn}
              className="bg-green-600 text-white py-3 px-6 rounded-2xl text-md"
            >
              New Return
            </button>
          )}
        </div>
        <div>
          <div className="card bg-red-100 rounded-2xl border-2 border-red-300">
            <div className="flex flex-col justify-center items-center px-8 py-4">
              <h1 className="font-medium text-red-800">Return Total</h1>
              <p className="text-lg text-red-600">
                -{returnTotal.toLocaleString()} DA
              </p>
            </div>
          </div>
        </div>
      </div>

      <SelectBuyFact
        isOpen={originalBillPopup}
        onClose={() => setOriginalBillPopup(false)}
        onSelect={handleOriginalBillSelect}
        supplierId={supplier?._id}
        type="purchase"
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
              `${BASEURL}/api/return-bon?format=a5&bonId=${savedTransactionId}`,
              "_blank"
            );
          }
        }}
        onPrintBonMini={() => {
          if (savedTransactionId) {
            window.open(
              `${BASEURL}/api/return-bon?format=a6&bonId=${savedTransactionId}`,
              "_blank"
            );
          }
        }}
        onPrintFacture={() => {
          if (savedTransactionId) {
            window.open(
              `${BASEURL}/api/return-facture?bonId=${savedTransactionId}`,
              "_blank"
            );
          }
        }}
        total={returnTotal}
        clientName={supplier?.name ?? "Not Selected"}
      />
    </div>
  );
}
