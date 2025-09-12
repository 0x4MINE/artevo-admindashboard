import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Popup({ isOpen, onClose, children }: PopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 bg-opacity-40 flex items-center justify-center z-50">
      <motion.div
        drag
        dragMomentum={false}
        ref={popupRef}
        className="bg-primary p-6 rounded-2xl shadow-lg min-w-[300px] relative"
      >
        {/* <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-red-600"
        >
          ✕
        </button> */}
        <div className="">{children}</div>
      </motion.div>
    </div>
  );
}
