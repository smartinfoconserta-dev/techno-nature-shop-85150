import { useState, useEffect } from "react";
import { settingsStore, InstallmentRate } from "@/lib/settingsStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info, Plus, X, Save, Settings as SettingsIcon, TestTube } from "lucide-react";
import { toast } from "sonner";
import ChangePasswordCard from "./ChangePasswordCard";
import { supabase } from "@/integrations/supabase/client";

const SettingsTab = () => {
  const [digitalTaxRate, setDigitalTaxRate] = useState(6);
  const [includeCashInTax, setIncludeCashInTax] = useState(false);
  const [installmentRates, setInstallmentRates] = useState<InstallmentRate[]>([]);
  const [showCashTaxWarning, setShowCashTaxWarning] = useState(false);
  const [pendingCashTaxValue, setPendingCashTaxValue] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newInstallments, setNewInstallments] = useState("");
  const [newRate, setNewRate] = useState("");
  const [editingRates, setEditingRates] = useState<Record<number, string>>({});
  const [creatingTestData, setCreatingTestData] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await settingsStore.getSettings();
    setDigitalTaxRate(settings.digitalTaxRate || 6);
    setIncludeCashInTax(settings.includeCashInTax || false);
    setInstallmentRates(settings.installmentRates || []);
  };

  const handleSaveTaxSettings = () => {
    if (digitalTaxRate < 0 || digitalTaxRate > 100) {
      toast.error("Taxa deve estar entre 0% e 100%");
      return;
    }

    try {
      settingsStore.updateTaxSettings(digitalTaxRate, includeCashInTax);
      toast.success("Configurações de impostos salvas!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configurações");
    }
  };

  const handleCashTaxChange = (checked: boolean) => {
    if (checked && !includeCashInTax) {
      // Tentando marcar - mostrar aviso
      setPendingCashTaxValue(true);
      setShowCashTaxWarning(true);
    } else {
      // Desmarcando - permitir direto
      setIncludeCashInTax(false);
    }
  };

  const confirmCashTaxChange = () => {
    setIncludeCashInTax(pendingCashTaxValue);
    setShowCashTaxWarning(false);
  };

  const handleCreateTestData = async () => {
    setCreatingTestData(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-test-data');
      if (error) throw error;
      toast.success('✅ Dados de teste criados com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar dados de teste');
    } finally {
      setCreatingTestData(false);
    }
  };

  const handleUpdateRate = (installments: number, newRate: number) => {
    if (newRate < 0 || newRate > 100) {
      toast.error("Taxa deve estar entre 0% e 100%");
      return;
    }

    try {
      settingsStore.updateSingleRate(installments, newRate);
      loadSettings();
      toast.success(`Taxa de ${installments}x atualizada!`, {
        duration: 1000,
      });
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar taxa");
    }
  };

  const handleAddInstallment = () => {
    const installments = parseInt(newInstallments);
    const rate = parseFloat(newRate);

    if (isNaN(installments) || installments < 1 || installments > 99) {
      toast.error("Número de parcelas deve estar entre 1 e 99");
      return;
    }

    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Taxa deve estar entre 0% e 100%");
      return;
    }

    try {
      settingsStore.addInstallmentRate(installments, rate);
      loadSettings();
      setShowAddDialog(false);
      setNewInstallments("");
      setNewRate("");
      toast.success(`Parcela ${installments}x adicionada!`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar parcela");
    }
  };

  const handleRemoveInstallment = (installments: number) => {
    try {
      settingsStore.removeInstallmentRate(installments);
      loadSettings();
      toast.success(`Parcela ${installments}x removida!`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover parcela");
    }
  };

  const calculateTaxExample = () => {
    const saleCash = 300;
    const saleDigital = 700;
    const saleTotal = saleCash + saleDigital;

    const taxOnlyDigital = saleDigital * (digitalTaxRate / 100);
    const taxOnTotal = saleTotal * (digitalTaxRate / 100);

    return {
      saleCash,
      saleDigital,
      saleTotal,
      taxOnlyDigital,
      taxOnTotal,
      difference: taxOnTotal - taxOnlyDigital,
    };
  };

  const example = calculateTaxExample();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          Configurações do Sistema
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure taxas de impostos e parcelamento para sua loja
        </p>
      </div>

      {/* Seção 0: Alteração de Senha */}
      <ChangePasswordCard />

      {/* Seção 0.5: Dados de Teste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            🧪 Dados de Teste
          </CardTitle>
          <CardDescription>
            Crie dados fictícios para testar o sistema (vendas rápidas, cadernetas, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleCreateTestData} 
            disabled={creatingTestData}
            variant="outline"
            className="w-full"
          >
            {creatingTestData ? "Criando dados..." : "🧪 Criar Dados de Teste"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Isso criará vendas rápidas, cadernetas e solicitações convertidas com diferentes status de pagamento e garantia
          </p>
        </CardContent>
      </Card>

      {/* Seção 1: Impostos */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Configurações de Impostos</CardTitle>
          <CardDescription>
            Configure como os impostos serão calculados sobre suas vendas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="taxRate">Taxa de Imposto (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={digitalTaxRate}
                onChange={(e) => setDigitalTaxRate(parseFloat(e.target.value) || 0)}
                className="max-w-[200px]"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="includeCash"
              checked={includeCashInTax}
              onCheckedChange={handleCashTaxChange}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="includeCash"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Incluir dinheiro físico no cálculo de imposto
              </label>
              <p className="text-sm text-muted-foreground">
                Por padrão, o imposto é calculado apenas sobre pagamentos digitais (PIX + Cartão)
              </p>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Como funciona:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  <strong>☐ Desmarcado:</strong> Imposto apenas sobre pagamentos digitais (PIX + Cartão)
                </li>
                <li>
                  <strong>☑ Marcado:</strong> Imposto sobre TUDO (Dinheiro + PIX + Cartão)
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Exemplo Visual */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Exemplo de Cálculo</CardTitle>
              <CardDescription className="text-xs">
                Venda de R$ {example.saleTotal.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>💵 Dinheiro:</span>
                <span className="font-semibold">R$ {example.saleCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>💻 Digital (PIX + Cartão):</span>
                <span className="font-semibold">R$ {example.saleDigital.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-orange-600">
                  <span>☐ Imposto sobre digital ({digitalTaxRate}%):</span>
                  <span className="font-bold">R$ {example.taxOnlyDigital.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>☑ Imposto sobre tudo ({digitalTaxRate}%):</span>
                  <span className="font-bold">R$ {example.taxOnTotal.toFixed(2)}</span>
                </div>
                {example.difference > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Diferença:</span>
                    <span>+R$ {example.difference.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveTaxSettings} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações de Impostos
          </Button>
        </CardContent>
      </Card>

      {/* Seção 2: Parcelamento */}
      <Card>
        <CardHeader>
          <CardTitle>💳 Taxas de Parcelamento</CardTitle>
          <CardDescription>
            Configure as taxas do cartão para cada quantidade de parcelas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {installmentRates.map((rate) => (
              <div
                key={rate.installments}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <span className="w-12 font-semibold text-foreground">
                  {rate.installments}x
                </span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editingRates[rate.installments] ?? rate.rate}
                  onChange={(e) => {
                    setEditingRates({
                      ...editingRates,
                      [rate.installments]: e.target.value
                    });
                  }}
                  onBlur={(e) => {
                    const newRate = parseFloat(e.target.value);
                    if (!isNaN(newRate)) {
                      handleUpdateRate(rate.installments, newRate);
                      const newEditing = { ...editingRates };
                      delete newEditing[rate.installments];
                      setEditingRates(newEditing);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  className="max-w-[120px]"
                />
                <span className="text-sm text-muted-foreground">%</span>
                {rate.installments <= 12 ? (
                  <Badge variant="secondary" className="ml-auto">
                    Padrão
                  </Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveInstallment(rate.installments)}
                    className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Parcela Customizada
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação - Imposto sobre Cash */}
      <AlertDialog open={showCashTaxWarning} onOpenChange={setShowCashTaxWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Atenção: Mudança no Cálculo de Impostos</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Ao marcar esta opção, o imposto de <strong>{digitalTaxRate}%</strong> será cobrado
                sobre <strong>TUDO</strong> que entrar, incluindo dinheiro físico.
              </p>
              <p className="text-orange-600 font-semibold">
                Isso aumentará o valor total de impostos a pagar em aproximadamente R${" "}
                {example.difference.toFixed(2)} por venda (baseado no exemplo acima).
              </p>
              <p>Deseja continuar?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingCashTaxValue(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmCashTaxChange}>
              Sim, incluir dinheiro físico
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog - Adicionar Parcela */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Parcela</DialogTitle>
            <DialogDescription>
              Configure uma taxa customizada para parcelamento em cartão
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newInstallments">Número de Parcelas</Label>
              <Input
                id="newInstallments"
                type="number"
                min="1"
                max="99"
                placeholder="Ex: 13, 14, 15..."
                value={newInstallments}
                onChange={(e) => setNewInstallments(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newRate">Taxa (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="newRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Ex: 10.5"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddInstallment}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsTab;
