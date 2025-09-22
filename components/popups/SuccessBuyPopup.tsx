"use client";
import React from "react";
import Popup from "@/components/Popup";

type SuccessBuyPopupProps = {
  isOpen: boolean;
  supplierName?: string;
  total: number;
  onClose: () => void;
};

export default function SuccessBuyPopup({
  isOpen,
  supplierName = "Supplier",
  total,
  onClose,
}: SuccessBuyPopupProps) {
  return (
    <Popup isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col justify-center items-center gap-5 p-6">
        {/* Success Message */}
        <div className="text-center">
          <div className="text-green-500 text-4xl mb-2">✓</div>
          <h1 className="text-2xl font-bold text-title mb-2">
            Purchase Saved!
          </h1>
          <p className="text-gray-600">Transaction has been completed successfully</p>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 w-full max-w-xs">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Supplier:</span>
            <span className="font-semibold">{supplierName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total:</span>
            <span className="font-bold text-lg">{total.toLocaleString()} DA</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="bg-btn-primary text-white py-3 px-8 rounded-2xl text-md hover:bg-blue-700 transition-colors w-full max-w-xs"
        >
          CONTINUE
        </button>
      </div>
    </Popup>
  );
}