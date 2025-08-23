import React from "react";

type StatusBadgeProps = {
  status: boolean | string;
  variant?: "default" | "compact" | "outlined";
  size?: "sm" | "md" | "lg";
};

export default function StatusBadge({ 
  status, 
  variant = "default",
  size = "md" 
}: StatusBadgeProps) {
  
  // Normalize status to boolean if it's a string
  const isActive = typeof status === "string" 
    ? status.toLowerCase() === "active" 
    : status;

  // Get status text
  const getStatusText = (isActive: boolean): string => {
    return isActive ? "Active" : "Inactive";
  };

  // Get base styling based on variant
  const getVariantStyles = (variant: string): string => {
    switch (variant) {
      case "compact":
        return "px-2 py-1";
      case "outlined":
        return "px-2.5 py-0.5 border-2";
      default:
        return "px-2.5 py-0.5";
    }
  };

  // Get size styling
  const getSizeStyles = (size: string): string => {
    switch (size) {
      case "sm":
        return "text-xs";
      case "lg":
        return "text-sm";
      default:
        return "text-xs";
    }
  };

  // Get status-specific styling
  const getStatusStyles = (isActive: boolean, variant: string): string => {
    if (variant === "outlined") {
      return isActive
        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
    }

    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  };

  // Status indicator dot (optional)
  const StatusDot = ({ isActive }: { isActive: boolean }) => (
    <span 
      className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
        isActive 
          ? "bg-green-500 dark:bg-green-400" 
          : "bg-red-500 dark:bg-red-400"
      }`}
    />
  );

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium transition-colors
        ${getVariantStyles(variant)}
        ${getSizeStyles(size)}
        ${getStatusStyles(isActive, variant)}
      `.trim().replace(/\s+/g, ' ')}
      role="status"
      aria-label={`Status: ${getStatusText(isActive)}`}
    >
      {variant !== "compact" && <StatusDot isActive={isActive} />}
      {getStatusText(isActive)}
    </span>
  );
}

// Alternative component for more specific use cases
export function SimpleStatusBadge({ status }: { status: boolean }) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
        ${status 
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        }
      `}
    >
      <span 
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status ? "bg-green-500" : "bg-red-500"
        }`}
      />
      {status ? "Active" : "Inactive"}
    </span>
  );
}

// Usage examples component (for documentation)
export function StatusBadgeExamples() {
  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">StatusBadge Examples</h3>
      
      <div className="space-y-2">
        <h4 className="font-medium">Default Variant:</h4>
        <div className="flex gap-2">
          <StatusBadge status={true} />
          <StatusBadge status={false} />
          <StatusBadge status="active" />
          <StatusBadge status="inactive" />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Outlined Variant:</h4>
        <div className="flex gap-2">
          <StatusBadge status={true} variant="outlined" />
          <StatusBadge status={false} variant="outlined" />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Compact Variant:</h4>
        <div className="flex gap-2">
          <StatusBadge status={true} variant="compact" />
          <StatusBadge status={false} variant="compact" />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Different Sizes:</h4>
        <div className="flex gap-2 items-center">
          <StatusBadge status={true} size="sm" />
          <StatusBadge status={true} size="md" />
          <StatusBadge status={true} size="lg" />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Simple Version:</h4>
        <div className="flex gap-2">
          <SimpleStatusBadge status={true} />
          <SimpleStatusBadge status={false} />
        </div>
      </div>
    </div>
  );
}