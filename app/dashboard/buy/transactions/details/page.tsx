"use client";
import CustomTable from "@/components/custom-table";
import SuccessPopup from "@/components/popups/SuccessPopup";
import PayPopup from "@/components/popups/PayPopup";
import SelectLot from "@/components/select/selectLot";
import SelectProduct from "@/components/select/selectProduct";
import SelectService from "@/components/select/selectService";

import { Switch } from "@/components/ui/switch";
import { Column } from "@/types/Column";
import { Calendar, RefreshCcw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";

function Details() {
  const supp_id = useSearchParams().get("supp_id");

  // Popup states
  const [productPopup, setProductPopup] = useState(false);
  const [servicePopup, setServicePopup] = useState(false);
  const [lotPopup, setLotPopup] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [payPopup, setPayPopup] = useState(false);

  // Selected product for lot selection
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  // Data states
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Product columns
  const pColumns: Column[] = [
    { key: "prod_id", label: "Product ID", type: "text" },
    { key: "prod_name", label: "Product Name", type: "text" },
    { key: "lot_id", label: "Lot ID", type: "text" },
    { key: "buyPrice", label: "Buy Price", type: "currency" },
    { key: "sellPrice", label: "Sell Price", type: "currency", editable: true },
    { key: "quantity", label: "Quantity", type: "text", editable: true },
  ];

  // Service columns
  const sColumns: Column[] = [
    { key: "serv_id", label: "ID", type: "text" },
    { key: "name", label: "Name", type: "text" },
    { key: "buyPrice", label: "Buy Price", type: "text" },
    { key: "sellPrice", label: "Sell Price", type: "text", editable: true },
    { key: "isActive", label: "Status", type: "status" },
    { key: "tva", label: "TVA", type: "text" },
  ];

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

  return (
    <div>
      {/* Buttons */}
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
          <p>Original Bill No: 150208</p>
          <p>Bill No: 00066/2025 </p>
          <p className="flex items-center gap-2">
            Date : 25/12/2025{" "}
            <Calendar
              className="bg-btn-primary text-white p-1 rounded-[6px]"
              size={25}
            />
          </p>
          <p>Reglement : Espece</p>
        </div>
        <div>
          <p className="flex items-center gap-2">
            Supplier : {supp_id}{" "}
            <RefreshCcw
              className="bg-btn-primary text-white p-1 rounded-[6px]"
              size={25}
            />
          </p>
          <p>Credit : 0.00</p>
          <p>Bonus Percent : 0%</p>
          <p>Bonus Amount : 0.00</p>
        </div>
      </div>

      {/* Products Table */}
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

        {/* Services Table */}
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
            onClick={() => setSuccessPopup(true)}
            className="bg-btn-primary text-white py-3 px-8 rounded-2xl text-md"
          >
            Save
          </button>
          <button className="bg-transparent text-btn-secondary border border-btn-secondary py-3 px-6 rounded-2xl text-md">
            Cancel
          </button>
        </div>
        <div>
          <div className="card bg-secondary flex rounded-2xl">
            <div className="flex flex-col justify-center items-center px-8 py-4 ">
              <h1 className="font-medium">Total</h1>
              <p className="text-lg">{total.toLocaleString()} </p>
              <p>DA</p>
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

      <SuccessPopup
        isOpen={successPopup}
        total={total}
        onClose={() => setSuccessPopup(false)}
        onPrintBonLarge={() => setPayPopup(true)}
        onPrintBonMini={() => setPayPopup(true)}
        onPrintFacture={() => setPayPopup(true)}
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

export default Details;
