import clsx from "clsx";
import React, { forwardRef } from "react";

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  isDisabled?: boolean;
  placeholder: string;
  type?: string;
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  controlled?: boolean; // Explicitly control whether it's controlled or uncontrolled
  required?: boolean;
  label?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const AddTextInput = forwardRef<HTMLInputElement, Props>(({
  isDisabled = false,
  type = "text",
  placeholder,
  value,
  defaultValue,
  onChange,
  name = "",
  error,
  className,
  controlled,
  required = false,
  label,
  helperText,
  startIcon,
  endIcon,
  ...rest
}, ref) => {
  // Determine if component should be controlled
  const isControlled = controlled !== undefined ? controlled : value !== undefined;
  
  // Input props based on controlled/uncontrolled state
  const inputProps = isControlled
    ? { value: value || '' }
    : { defaultValue };

  return (
    <div className="flex flex-col gap-1">
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-title">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Error message at top */}
      {error && (
        <p className="text-red-500 text-sm" role="alert">
          {error}
        </p>
      )}

      {/* Input container */}
      <div className="relative">
        {/* Start icon */}
        {startIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {startIcon}
          </div>
        )}

        {/* Input field */}
        <input
          ref={ref}
          type={type}
          name={name}
          className={clsx(
            // Base styles
            "bg-secondary text-title p-4 rounded-2xl text-center placeholder:text-center w-full",
            "border border-transparent transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            
            // Disabled styles
            isDisabled && "opacity-50 cursor-not-allowed bg-gray-100",
            
            // Error styles
            error && "border-red-500 focus:ring-red-500",
            
            // Icon padding
            startIcon && "pl-10",
            endIcon && "pr-10",
            
            // Custom className
            className
          )}
          placeholder={placeholder}
          disabled={isDisabled}
          onChange={onChange}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${name}-error` : helperText ? `${name}-helper` : undefined
          }
          {...inputProps}
          {...rest}
        />

        {/* End icon */}
        {endIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {endIcon}
          </div>
        )}
      </div>

      {/* Helper text */}
      {helperText && !error && (
        <p className="text-sm text-gray-500" id={`${name}-helper`}>
          {helperText}
        </p>
      )}
    </div>
  );
});

AddTextInput.displayName = "AddTextInput";

export default AddTextInput;