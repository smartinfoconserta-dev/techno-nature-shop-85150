import { useState, useEffect } from "react";
import { couponsStore, Coupon } from "@/lib/couponsStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import CouponForm from "./CouponForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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

const CouponsTab = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    const coupons = await couponsStore.getAllCoupons();
    setCoupons(coupons);
  };

  const handleAdd = () => {
    setEditingCoupon(null);
    setFormOpen(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormOpen(true);
  };

  const handleSubmit = async (code: string, active: boolean) => {
    try {
      if (editingCoupon) {
        await couponsStore.updateCoupon(editingCoupon.id, code, active);
        toast.success("Cupom atualizado com sucesso!");
      } else {
        await couponsStore.addCoupon(code);
        toast.success("Cupom criado com sucesso!");
      }
      setFormOpen(false);
      setEditingCoupon(null);
      await loadCoupons();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar cupom");
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      await couponsStore.toggleCouponStatus(coupon.id);
      toast.success(
        coupon.active ? "Cupom desativado com sucesso!" : "Cupom ativado com sucesso!"
      );
      await loadCoupons();
    } catch (error) {
      toast.error("Erro ao alterar status do cupom");
    }
  };

  const handleDeleteClick = (id: string) => {
    setCouponToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (couponToDelete) {
      try {
        await couponsStore.deleteCoupon(couponToDelete);
        toast.success("Cupom excluído com sucesso!");
        await loadCoupons();
      } catch (error) {
        toast.error("Erro ao excluir cupom");
      }
    }
    setDeleteDialogOpen(false);
    setCouponToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">🎟️ Cupons de Desconto</h2>
          <p className="text-muted-foreground">
            Gerencie os cupons promocionais da sua loja
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cupom
        </Button>
      </div>

      {coupons.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum cupom cadastrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro cupom de desconto para oferecer promoções aos seus clientes.
            </p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Cupom
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <Card
              key={coupon.id}
              className={
                coupon.active
                  ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                  : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20 opacity-75"
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-2xl font-bold">
                        {coupon.code}
                      </CardTitle>
                      <Badge
                        variant={coupon.active ? "default" : "destructive"}
                        className={
                          coupon.active
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                        }
                      >
                        {coupon.active ? "ATIVO" : "INATIVO"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cupom de acesso ao preço de lojista B2B
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <p>
                    Criado em:{" "}
                    {format(new Date(coupon.createdAt), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                  <p>
                    Atualizado:{" "}
                    {format(new Date(coupon.updatedAt), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(coupon)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant={coupon.active ? "outline" : "default"}
                    onClick={() => handleToggleStatus(coupon)}
                  >
                    <Power className="h-3 w-3 mr-1" />
                    {coupon.active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteClick(coupon.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CouponForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        editingCoupon={editingCoupon}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cupom? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CouponsTab;
