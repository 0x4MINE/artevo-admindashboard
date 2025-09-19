import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

function Loader() {
  return (
    <motion.div
      className="min-h-screen bg-background flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        <motion.div
          animate={{
            rotate: 360,
            transition: {
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        >
          <RefreshCw className="mx-auto mb-4 text-btn-secondary" size={32} />
        </motion.div>
        <motion.p
          className="text-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Loading Data...
        </motion.p>
      </div>
    </motion.div>
  );
}

export default Loader;
