import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onChange, onWheel, onKeyDown, onFocus, inputMode, ...props }, ref) => {
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (type === "number") {
        let inputValue = e.target.value;

        // Permitir apenas números, ponto e vírgula
        inputValue = inputValue.replace(/[^\d.,]/g, "");

        // Substituir vírgula por ponto
        inputValue = inputValue.replace(",", ".");

        // Remover zeros à esquerda, EXCETO se for "0" sozinho ou "0."
        if (inputValue.length > 1 && inputValue[0] === "0" && inputValue[1] !== ".") {
          inputValue = inputValue.replace(/^0+/, "");
        }

        // Permitir apenas um ponto decimal
        const parts = inputValue.split(".");
        if (parts.length > 2) {
          inputValue = parts[0] + "." + parts.slice(1).join("");
        }

        // Atualizar o valor do input
        e.target.value = inputValue;
      }

      onChange?.(e);
    };

    const handleNumberWheelCapture = (e: React.WheelEvent<HTMLInputElement>) => {
      if (type === "number") {
        // Desfoca o input antes do evento de rolagem processar, evitando alteração de valor
        (e.currentTarget as HTMLInputElement).blur();
      }
    };

    const handleNumberWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      if (type === "number") {
        // Garantia extra: desfoca caso o capture não tenha funcionado
        (e.currentTarget as HTMLInputElement).blur();
      }
      onWheel?.(e);
    };

    const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (type === "number" && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
      }
      onKeyDown?.(e);
    };

    const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (type === "number") {
        const value = e.target.value;
        if (value === "0" || value === "0.00" || value === "") {
          e.target.value = "";
        } else {
          setTimeout(() => e.target.select(), 0);
        }
      }
      onFocus?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          type === "number" && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className,
        )}
        inputMode={type === "number" && !inputMode ? "decimal" : inputMode}
        ref={ref}
        onChange={handleNumberChange}
        onWheelCapture={handleNumberWheelCapture}
        onWheel={handleNumberWheel}
        onKeyDown={handleNumberKeyDown}
        onFocus={handleNumberFocus}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
