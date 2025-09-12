"use client";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import StatusBadge from "./StatusBadge";
import { Column } from "@/types/Column";
import { MoreHorizontal, Edit, Trash2, Eye, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import clsx from "clsx";
import { useFilterStore } from "@/lib/store/useFilter";
import { deleteUser } from "@/lib/actions/userActions";
import Loader from "./layout/Loader";

type ActionItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: any) => void;
  variant?: "default" | "destructive";
  separator?: boolean;
};

type TTableProps = {
  data: any[];
  columns?: Column[];
  className?: string;
  searchTerm?: string;
  showPagination?: boolean;
  itemsPerPage?: number;
  actions?: ActionItem[];
  showActions?: boolean;
  title?: string;
  onDoubleClick?: (item: any, event: React.MouseEvent) => void;
  onEdit?: (updatedRow: any, rowIndex: number) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  loading?: boolean; // NEW: Loading prop
};

export default function CustomTable({
  data,
  columns = [],
  className = "",
  searchTerm = "",
  showPagination = true,
  itemsPerPage = 10,
  actions = [],
  showActions = true,
  title,
  onDoubleClick,
  onEdit,
  currentPage: externalCurrentPage,
  onPageChange: externalOnPageChange,
  totalItems: externalTotalItems,
  loading = false, // NEW: Loading state
}: TTableProps) {
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const currentPage =
    externalCurrentPage !== undefined
      ? externalCurrentPage
      : internalCurrentPage;
  const setCurrentPage = externalOnPageChange || setInternalCurrentPage;

  const { filters } = useFilterStore();
  const [tableData, setTableData] = useState(data);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const lastClickTimestamps = useRef<{ [key: number]: number }>({});

  const defaultActions: ActionItem[] = [
    {
      label: "View",
      icon: <Eye className="h-4 w-4" />,
      onClick: (item) => console.log("View:", item),
    },
    {
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
      onClick: (item) => console.log("Edit:", item),
    },
    {
      label: "Duplicate",
      icon: <Copy className="h-4 w-4" />,
      onClick: (item) => console.log("Duplicate:", item),
      separator: true,
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (item) => deleteUser(item._id),
      variant: "destructive" as const,
    },
  ];

  const actionItems = actions.length > 0 ? actions : defaultActions;

  // For server-side pagination, we don't filter on the client
  const filteredData = useMemo(() => {
    if (externalTotalItems !== undefined) {
      // Server-side pagination: use the data as-is (filtering is done on server)
      return data;
    } else {
      // Client-side filtering
      return tableData
        .filter((item) => {
          if (filters.isActive !== null) {
            return filters.isActive
              ? item.isActive === true
              : item.isActive === false;
          }
          return true;
        })
        .filter((item) => {
          const itemDate = new Date(item.createdAt);
          const [from, to] = filters.dateRange;

          if (from && itemDate < new Date(from)) return false;
          if (to && itemDate > new Date(to)) return false;

          return true;
        })
        .filter((item) => {
          const quantity = item.amount ?? item.quantity ?? 0;
          return (
            quantity >= filters.quantityRange[0] &&
            quantity <= filters.quantityRange[1]
          );
        })
        .filter((item) =>
          Object.values(item).some((value) =>
            value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
    }
  }, [tableData, filters, searchTerm, externalTotalItems, data]);

  const totalItems =
    externalTotalItems !== undefined ? externalTotalItems : filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  // For server-side pagination, we use the data directly
  // For client-side, we slice the filtered data
  const paginatedData = useMemo(() => {
    if (externalTotalItems !== undefined) {
      // Server-side: data is already paginated from API
      return data;
    } else {
      // Client-side: slice the filtered data
      return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }
  }, [externalTotalItems, data, filteredData, startIndex, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages, setCurrentPage]);

  const renderCell = useCallback(
    (item: any, column: Column, rowIndex: number) => {
      const value = item[column.key];

      if (column.editable) {
        return (
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => {
              const newValue = e.target.value;
              const updatedData = [...tableData];
              updatedData[rowIndex] = {
                ...updatedData[rowIndex],
                [column.key]: newValue,
              };
              setTableData(updatedData);
              onEdit?.(updatedData[rowIndex], rowIndex);
            }}
            className="bg-transparent border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      }

      switch (column.type) {
        case "status":
          return <StatusBadge variant="compact" status={value} />;
        case "currency":
          return <span className="font-medium text-center">{value}</span>;
        case "date":
          return (
            <span className="text-title text-center">
              {new Date(value).toLocaleDateString() === "Invalid Date"
                ? "-"
                : new Date(value).toLocaleDateString()}
            </span>
          );
        default:
          return (
            <span className="text-title text-center">
              {value === null || value === undefined || value === ""
                ? "-"
                : value}
            </span>
          );
      }
    },
    [tableData, onEdit]
  );

  const renderActionsCell = useCallback(
    (item: any) => {
      return (
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[160px] bg-background border border-btn-secondary"
            >
              {actionItems.map((action, index) => (
                <div key={index}>
                  <DropdownMenuItem
                    onClick={() => action.onClick(item)}
                    className={`cursor-pointer ${
                      action.variant === "destructive"
                        ? "text-red-600 focus:text-red-600"
                        : ""
                    }`}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                  {action.separator && (
                    <DropdownMenuSeparator className="border-t border-btn-secondary" />
                  )}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    [actionItems]
  );

  const handleRowClick = useCallback(
    (index: number, item: any, e: React.MouseEvent) => {
      const now = Date.now();
      const lastClick = lastClickTimestamps.current[index] || 0;

      if (now - lastClick < 300) {
        e.preventDefault();
        e.stopPropagation();
        onDoubleClick?.(item, e);
        lastClickTimestamps.current[index] = 0;
      } else {
        lastClickTimestamps.current[index] = now;
      }
    },
    [onDoubleClick]
  );

  return (
    <div
      className={`bg-background rounded-2xl shadow-sm border border-secondary overflow-hidden ${className}`}
    >
      {title && (
        <div className="px-6 py-2 text-xl font-semibold text-subtitle text-center">
          {title}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary">
          <thead className="bg-primary">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    column.key === "debt" ? "text-inactive" : "text-subtitle"
                  )}
                >
                  {column.label}
                </th>
              ))}
              {showActions && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="bg-background divide-y divide-secondary">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <tr
                  key={index}
                  onClick={(e) => handleRowClick(startIndex + index, item, e)}
                  className={clsx(
                    "hover:bg-primary transition-colors",
                    onDoubleClick && "cursor-pointer select-none"
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-title"
                    >
                      {renderCell(item, column, startIndex + index)}
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {renderActionsCell(item)}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (showActions ? 1 : 0)}
                  className="px-6 py-12 text-center text-subtitle"
                >
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="px-6 py-3 bg-primary border-t border-secondary flex items-center justify-between">
          <div className="text-sm text-subtitle">
            Showing {Math.min(startIndex + 1, totalItems)} to{" "}
            {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems}{" "}
            results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                disabled={loading}
                className={`px-3 py-1 text-sm border rounded-md ${
                  currentPage === page
                    ? "bg-blue-500 text-white border-blue-500"
                    : "border-gray-300 hover:bg-gray-100"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || loading}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
