import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { customersStore, Customer } from "@/lib/customersStore";

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  onNewCustomer: () => void;
  customers: Customer[];
}

const CustomerSelector = ({ selectedCustomer, onCustomerSelect, onNewCustomer, customers }: CustomerSelectorProps) => {
  const [open, setOpen] = useState(false);

  const handleSelectChange = (customerId: string) => {
    if (customerId === "new") {
      onNewCustomer();
      setOpen(false);
      return;
    }
    
    const customer = customers.find(c => c.id === customerId);
    onCustomerSelect(customer || null);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Cliente/Lojista</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedCustomer
                ? `${selectedCustomer.code} - ${selectedCustomer.name}`
                : "Selecionar cliente..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar cliente..." />
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="new"
                  onSelect={() => handleSelectChange("new")}
                  className="text-primary font-semibold"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  + Cadastrar Novo Cliente
                </CommandItem>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={`${customer.code} ${customer.name}`}
                    onSelect={() => handleSelectChange(customer.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
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

      {selectedCustomer && (
        <Card className="p-4 bg-muted/50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Código:</span>
              <span className="font-semibold">{selectedCustomer.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome:</span>
              <span className="font-medium">{selectedCustomer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CPF/CNPJ:</span>
              <span className="font-mono text-xs">{selectedCustomer.cpfCnpj}</span>
            </div>
            {selectedCustomer.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefone:</span>
                <span>{selectedCustomer.phone}</span>
              </div>
            )}
            {selectedCustomer.creditLimit !== undefined && selectedCustomer.creditLimit > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Limite de Crédito:</span>
                <span className="font-semibold text-green-600">
                  R$ {selectedCustomer.creditLimit.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CustomerSelector;
