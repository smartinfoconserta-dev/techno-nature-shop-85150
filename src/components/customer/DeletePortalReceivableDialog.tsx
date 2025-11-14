import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Receivable {
  id: string;
  productName: string;
  totalAmount: number;
  paidAmount: number;
}

interface DeletePortalReceivableDialogProps {
  receivable: Receivable | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeletePortalReceivableDialog({
  receivable,
  open,
  onOpenChange,
  onDeleted,
}: DeletePortalReceivableDialogProps) {
  const [deleteType, setDeleteType] = useState<"hide" | "permanent">("hide");
  const { toast } = useToast();

  if (!receivable) return null;

  const handleDelete = async () => {
    try {
      if (deleteType === "hide") {
        // SOFT DELETE: Ocultar do portal, mantém no financeiro
        const { error } = await supabase
          .from("receivables")
          .update({ hidden_from_portal: true })
          .eq("id", receivable.id);

        if (error) throw error;

        toast({
          title: "Item ocultado",
          description: "Removido da visualização mas mantido no histórico financeiro",
        });
      } else {
        // HARD DELETE: Exclusão permanente (soft delete com deleted_at)
        const { error } = await supabase
          .from("receivables")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", receivable.id);

        if (error) throw error;

        toast({
          title: "Item excluído permanentemente",
          description: "Removido do sistema e dos relatórios financeiros",
          variant: "destructive",
        });
      }

      onDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o item",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Compra</AlertDialogTitle>
          <AlertDialogDescription>
            Como você deseja excluir este item?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RadioGroup value={deleteType} onValueChange={(v) => setDeleteType(v as "hide" | "permanent")}>
          {/* Opção 1: Soft Delete */}
          <div className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="hide" id="hide" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="hide" className="font-semibold cursor-pointer text-base">
                Ocultar da lista
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Remove da visualização mas <strong className="text-foreground">mantém no histórico financeiro</strong> e relatórios mensais.
              </p>
              <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-300">
                ✓ Recomendado para organização
              </Badge>
            </div>
          </div>

          {/* Opção 2: Hard Delete */}
          <div className="flex items-start gap-3 p-4 border-2 border-destructive/30 rounded-lg hover:bg-destructive/5 transition-colors">
            <RadioGroupItem value="permanent" id="permanent" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="permanent" className="font-semibold text-destructive cursor-pointer text-base">
                Excluir permanentemente
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Remove completamente do sistema. <strong className="text-destructive">Afeta relatórios mensais!</strong>
              </p>
              <Badge variant="destructive" className="mt-2">
                ⚠️ Use apenas para correção de erros
              </Badge>
            </div>
          </div>
        </RadioGroup>

        {/* Info do produto */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm border border-border">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Produto:</span>
            <span className="font-medium">{receivable.productName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Valor Total:</span>
            <span className="font-medium">R$ {receivable.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Pago:</span>
            <span className="font-medium text-green-600">R$ {receivable.paidAmount.toFixed(2)}</span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className={deleteType === "permanent" ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {deleteType === "hide" ? "Ocultar Item" : "Excluir Permanentemente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
