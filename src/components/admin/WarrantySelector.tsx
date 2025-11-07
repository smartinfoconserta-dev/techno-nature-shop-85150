import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface WarrantySelectorProps {
  value: number;
  onChange: (days: number) => void;
}

const WarrantySelector = ({ value, onChange }: WarrantySelectorProps) => {
  const options = [
    { days: 0, label: "Sem Garantia" },
    { days: 7, label: "7 dias" },
    { days: 15, label: "15 dias" },
    { days: 30, label: "30 dias" },
    { days: 60, label: "60 dias" },
    { days: 90, label: "90 dias" },
  ];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">🛡️ Garantia</Label>
      <RadioGroup value={value.toString()} onValueChange={(v) => onChange(parseInt(v))}>
        {options.map(option => (
          <div key={option.days} className="flex items-center space-x-2">
            <RadioGroupItem value={option.days.toString()} id={`warranty-${option.days}`} />
            <Label htmlFor={`warranty-${option.days}`} className="font-normal cursor-pointer">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default WarrantySelector;
