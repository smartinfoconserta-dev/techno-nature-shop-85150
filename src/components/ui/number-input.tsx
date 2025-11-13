import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "value"> {
  value?: number | string;
  onChange?: (value: number | undefined) => void;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, onFocus, onBlur, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value?.toString() || "");

    React.useEffect(() => {
      setInternalValue(value?.toString() || "");
    }, [value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Se o valor for "0" ou vazio, limpar o campo
      if (internalValue === "0" || internalValue === "0.00" || internalValue === "") {
        setInternalValue("");
        onChange?.(undefined);
      } else {
        // Selecionar todo o texto ao focar para fácil substituição
        setTimeout(() => e.target.select(), 0);
      }
      onFocus?.(e);
    };

    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      // Prevenir o comportamento padrão do scroll no input
      e.preventDefault();
      e.stopPropagation();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setInternalValue(inputValue);

      // Se vazio, enviar undefined
      if (!inputValue || inputValue === "") {
        onChange?.(undefined);
        return;
      }

      // Converter para número
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        onChange?.(numValue);
      }
    };

    return (
      <Input
        type="text"
        inputMode="decimal"
        ref={ref}
        value={internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={onBlur}
        onWheel={handleWheel}
        className={cn(
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className
        )}
        {...props}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };
