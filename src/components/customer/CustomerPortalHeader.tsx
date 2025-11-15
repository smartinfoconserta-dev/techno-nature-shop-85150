import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, FileText, Plus, User, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface CustomerPortalHeaderProps {
  customerName: string;
  onLogout: () => void;
  onPrintPDF: () => void;
  onAddNotebook: () => void;
  creditBalance?: number;
}

export const CustomerPortalHeader = ({
  customerName,
  onLogout,
  onPrintPDF,
  onAddNotebook,
  creditBalance
}: CustomerPortalHeaderProps) => {
  const [open, setOpen] = useState(false);

  const menuItems = [
    { 
      icon: ShoppingBag, 
      label: "Minhas Compras", 
      onClick: () => setOpen(false),
      section: "main"
    },
    { 
      icon: Plus, 
      label: "Adicionar Item Caderneta", 
      onClick: () => { onAddNotebook(); setOpen(false); },
      section: "actions"
    },
    { 
      icon: FileText, 
      label: "Imprimir Relatório", 
      onClick: () => { onPrintPDF(); setOpen(false); },
      section: "actions"
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {customerName}
                </SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="h-[calc(100vh-8rem)] py-4">
                <div className="space-y-1">
                  {/* Crédito disponível */}
                  {creditBalance && creditBalance > 0 && (
                    <>
                      <div className="px-3 py-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Crédito Disponível</p>
                        <p className="text-lg font-bold text-primary">
                          {creditBalance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                      </div>
                      <Separator className="my-4" />
                    </>
                  )}

                  {/* Menu Principal */}
                  <div className="space-y-1">
                    <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                      Menu
                    </p>
                    {menuItems.filter(item => item.section === "main").map((item, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11"
                        onClick={item.onClick}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{item.label}</span>
                      </Button>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Ações */}
                  <div className="space-y-1">
                    <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                      Ações
                    </p>
                    {menuItems.filter(item => item.section === "actions").map((item, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11"
                        onClick={item.onClick}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{item.label}</span>
                      </Button>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Sair */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => { onLogout(); setOpen(false); }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Sair</span>
                  </Button>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <h1 className="text-lg font-semibold">Portal do Cliente</h1>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onAddNotebook}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Caderneta
          </Button>
          <Button variant="outline" size="sm" onClick={onPrintPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};
