import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [popoverOpen, setPopoverOpen] = useState(false);
  
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
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-full justify-between"
                  >
                    {selectedCustomerId
                      ? customers.find((c) => c.id === selectedCustomerId)?.name
                      : "Escolha um cliente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setShowNewCustomerDialog(true);
                          setPopoverOpen(false);
                        }}
                        className="text-primary font-semibold"
                      >
                        + Cadastrar Novo Cliente
                      </CommandItem>
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={`${customer.code} ${customer.name}`}
                          onSelect={() => {
                            setSelectedCustomerId(customer.id);
                            setPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {customer.code} - {customer.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
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
