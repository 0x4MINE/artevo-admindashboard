"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { toast, Toaster } from "sonner";

import CustomTable from "@/components/custom-table";
import ContentNavbar from "@/components/layout/ContentNavbar";
import SelectBuyFact from "@/components/select/selectBuyFact";
import { getBuyReturns } from "@/lib/actions/transactionActions";
import { useFilterStore } from "@/lib/store/useFilter";
import { Column } from "@/types/Column";

export default function ReturnTransactions() {
  const router = useRouter();
  const { filters } = useFilterStore();
  const [invoicesPopUp, setInvoicesPopUp] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const columns: Column[] = [
    { key: "return_id", label: "ID", type: "text" },
    { key: "date", label: "Date", type: "date" },
    { key: "supplier_name", label: "Supplier", type: "text" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "by", label: "By", type: "text" },
    { key: "originalCode", label: "Original Bill", type: "text" },
  ];

  useEffect(() => {
    fetchReturnTransactions();
  }, [filters]);

  const fetchReturnTransactions = async () => {
    try {
      const returns = await getBuyReturns();
      setData(returns);
    } catch (error) {
      toast.error("Failed to fetch return transactions");
      console.error("Error fetching returns:", error);
    }
  };

  const handleInvoicesSelect = (invoice: any) => {
    router.push(`/dashboard/buy/return/details?supp_id=${invoice.supp_id}`);
  };

  const handleViewReturn = (returnItem: any) => {
    window.open(`/api/buy-return?bonId=${returnItem._id}`, "_blank");
  };

  return (
    <div>
      <Toaster />
      <ContentNavbar
        filters={["active"]}
        setSearch={setSearch}
        setPopUp={setInvoicesPopUp}
      />

      <div className="p-8">
        <CustomTable
          data={data}
          columns={columns}
          showActions
          searchTerm={search}
          actions={[
            {
              label: "View",
              icon: <Eye className="h-4 w-4" />,
              onClick: handleViewReturn,
            },
          ]}
        />
      </div>

      <SelectBuyFact
        isOpen={invoicesPopUp}
        onClose={() => setInvoicesPopUp(false)}
        onSelect={handleInvoicesSelect}
      />
    </div>
  );
}
