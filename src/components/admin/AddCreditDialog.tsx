import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { customersStore, Customer } from "@/lib/customersStore";
import { creditHistoryStore } from "@/lib/creditHistoryStore";
import { useToast } from "@/hooks/use-toast";

interface AddCreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onConfirm: () => void;
}

export const AddCreditDialog = ({
  open,
  onOpenChange,
  customer,
  onConfirm,
}: AddCreditDialogProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!customer) return;

    const value = parseFloat(amount);

    if (isNaN(value) || value <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor maior que zero",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo para adicionar crédito",
        variant: "destructive",
      });
      return;
    }

    try {
      customersStore.addCredit(customer.id, value, description.trim());
      creditHistoryStore.addTransaction({
        customerId: customer.id,
        type: "add",
        amount: value,
        description: description.trim(),
      });

      toast({
        title: "Crédito adicionado! 💰",
        description: `R$ ${value.toFixed(2)} adicionado ao haver do cliente`,
      });

      setAmount("");
      setDescription("");
      onConfirm();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar crédito",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>➕ Adicionar Crédito Manual</DialogTitle>
        </DialogHeader>

        {customer && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg space-y-1">
              <p className="text-sm text-muted-foreground">Cliente:</p>
              <p className="font-semibold">{customer.name}</p>
              <p className="text-sm text-muted-foreground mt-2">Crédito Atual:</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {(customer.creditBalance || 0).toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor a adicionar</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAmount(50)}
              >
                +R$ 50
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAmount(100)}
              >
                +R$ 100
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAmount(200)}
              >
                +R$ 200
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Motivo <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Ex: Ajuste por erro no sistema, Compensação, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                O motivo é obrigatório para rastreabilidade
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Adicionar Crédito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
