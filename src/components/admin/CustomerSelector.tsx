import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customersStore, Customer } from "@/lib/customersStore";
import { UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  onNewCustomer: () => void;
  customers: Customer[];
}

const CustomerSelector = ({ selectedCustomer, onCustomerSelect, onNewCustomer, customers }: CustomerSelectorProps) => {
  const handleSelectChange = (value: string) => {
    if (value === "new") {
      onNewCustomer();
      return;
    }
    
    const customer = customers.find(c => c.id === value);
    onCustomerSelect(customer || null);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Cliente/Lojista</label>
        <Select value={selectedCustomer?.id || ""} onValueChange={handleSelectChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar cliente..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="font-medium">+ Cadastrar Novo Cliente</span>
              </div>
            </SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.code} - {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
