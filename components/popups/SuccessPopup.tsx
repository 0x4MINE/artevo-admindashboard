"use client";
import React from "react";
import Popup from "@/components/Popup";

type SuccessPopupProps = {
  isOpen: boolean;
  clientName?: string;
  total: number;
  onClose: () => void;
  onPrintBonLarge: () => void;
  onPrintBonMini: () => void;
  onPrintFacture: () => void;
};

export default function SuccessPopup({
  isOpen,
  clientName = "Walid",
  total,
  onClose,
  onPrintBonLarge,
  onPrintBonMini,
  onPrintFacture,
}: SuccessPopupProps) {
  return (
    <Popup isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col justify-center items-center gap-3">
        <h1 className="text-2xl font-bold text-title">
          Bill Added Successfully
        </h1>

        <div className="flex justify-evenly items-center w-full">
          <p>Client:Walid</p>
          <div className="bg-secondary flex flex-col py-3 px-10 rounded-2xl items-center">
            <p>Total</p>
            <h1 className="text-xl font-bold text-title">{total}</h1>
            <p>DA</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onPrintBonLarge}
            className="bg-transparent text-btn-secondary border border-btn-secondary py-3 px-6 rounded-2xl text-md"
          >
            PRINT BON LARGE
          </button>
          <button
            onClick={onPrintBonMini}
            className="bg-transparent text-btn-secondary border border-btn-secondary py-3 px-6 rounded-2xl text-md"
          >
            PRINT BON MINI
          </button>
          <button
            onClick={onPrintFacture}
            className="bg-transparent text-btn-secondary border border-btn-secondary py-3 px-6 rounded-2xl text-md"
          >
            PRINT FACTURE
          </button>
        </div>
        <button
          onClick={onClose}
          className="bg-btn-primary text-white py-3 px-8 rounded-2xl text-md"
        >
          DONE
        </button>
      </div>
    </Popup>
  );
}
