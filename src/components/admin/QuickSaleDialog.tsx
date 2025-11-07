import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { customersStore } from "@/lib/customersStore";
import { AddManualReceivableDialog } from "./AddManualReceivableDialog";

interface QuickSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const QuickSaleDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: QuickSaleDialogProps) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [showSaleForm, setShowSaleForm] = useState(false);

  const customers = customersStore.getActiveCustomers();

  const handleNext = () => {
    if (!selectedCustomerId) return;
    setShowSaleForm(true);
  };

  const handleSaleSuccess = () => {
    onSuccess();
    setSelectedCustomerId("");
    setShowSaleForm(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedCustomerId("");
    setShowSaleForm(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open && !showSaleForm} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🛍️ Nova Venda</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecione o Cliente *</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.code} - {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleNext} disabled={!selectedCustomerId} className="w-full">
              Continuar →
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AddManualReceivableDialog
        open={showSaleForm}
        onOpenChange={setShowSaleForm}
        customerId={selectedCustomerId}
        onSuccess={handleSaleSuccess}
      />
    </>
  );
};

export default QuickSaleDialog;
