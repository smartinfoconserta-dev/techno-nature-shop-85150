import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveFilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
  className?: string;
}

export const ActiveFilterChip = ({
  label,
  value,
  onRemove,
  className,
}: ActiveFilterChipProps) => {
  return (
    <Badge 
      variant="secondary" 
      className={cn("gap-1 pr-1 cursor-pointer hover:bg-secondary/80 transition-colors", className)}
      onClick={onRemove}
    >
      <span className="text-xs">
        <span className="font-medium">{label}:</span> {value}
      </span>
      <X className="h-3 w-3 ml-1" />
    </Badge>
  );
};
