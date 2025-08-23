"use client";
import React from "react";
import Popup from "../Popup";
import SelectInput from "@/components/forms/SelectInput";

type PayPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
};

export default function PayPopup({
  isOpen,
  onClose,
  paymentMethod,
  setPaymentMethod,
}: PayPopupProps) {
  return (
    <Popup isOpen={isOpen} onClose={onClose}>
      <div className="h-[30vh] w-full flex flex-col justify-between p-6">
        {/* Header */}
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-2xl font-bold text-title text-center">
            Select Payment Method
          </h1>
        </div>

        {/* Dropdown */}
        <div className="flex justify-center items-center mb-6 w-full">
          <SelectInput
            placeholder="How did the client pay?"
            options={["Cash", "Cheque", "Order Virement"]}
            defaultValue={paymentMethod}
            onSelect={(val) => setPaymentMethod(val)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="bg-btn-primary text-white py-3 px-4 rounded-2xl text-sm w-full"
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="bg-transparent border border-gray-400 py-3 px-4 rounded-2xl text-sm w-full"
          >
            Cancel
          </button>
        </div>
      </div>
    </Popup>
  );
}
