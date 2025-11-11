import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { customersStore, Customer } from "@/lib/customersStore";
import { AddManualReceivableDialog } from "./AddManualReceivableDialog";
import NewCustomerDialog from "./NewCustomerDialog";
import { useToast } from "@/hooks/use-toast";

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
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const { toast } = useToast();
  
  useEffect(() => {
    if (open) {
      customersStore.getActiveCustomers().then(setCustomers);
    }
  }, [open]);

  const handleNext = () => {
    if (!selectedCustomerId) return;
    setShowSaleForm(true);
  };

  const handleCustomerCreated = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setShowNewCustomerDialog(false);
    toast({
      title: "Cliente cadastrado!",
      description: `${customer.code} - ${customer.name} foi adicionado`,
    });
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
              <Select 
                value={selectedCustomerId} 
                onValueChange={(value) => {
                  if (value === "new") {
                    setShowNewCustomerDialog(true);
                  } else {
                    setSelectedCustomerId(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new" className="text-primary font-semibold">
                    + Cadastrar Novo Cliente
                  </SelectItem>
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

      <NewCustomerDialog
        open={showNewCustomerDialog}
        onOpenChange={setShowNewCustomerDialog}
        onCustomerCreated={handleCustomerCreated}
      />

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
