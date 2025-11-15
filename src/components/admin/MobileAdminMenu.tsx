import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  LayoutDashboard,
  Zap,
  BookOpen,
  ScrollText,
  Package,
  Ticket,
  Users,
  DollarSign,
  Notebook,
  Trash2,
  Settings,
  LogOut,
} from "lucide-react";
import { useState } from "react";

interface MobileAdminMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingRequestsCount: number;
  onLogout: () => void;
}

export const MobileAdminMenu = ({
  activeTab,
  onTabChange,
  pendingRequestsCount,
  onLogout,
}: MobileAdminMenuProps) => {
  const [open, setOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setOpen(false);
  };

  const menuItems = [
    {
      category: "PRINCIPAL",
      items: [
        { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { value: "products", label: "Produtos", icon: Package },
      ],
    },
    {
      category: "VENDAS",
      items: [
        { value: "quick-sales", label: "Vendas Rápidas", icon: Zap },
        { value: "receivables", label: "Caderneta", icon: BookOpen },
        { value: "history", label: "Histórico", icon: ScrollText },
      ],
    },
    {
      category: "FINANÇAS",
      items: [
        { value: "finance", label: "Financeiro", icon: DollarSign },
      ],
    },
    {
      category: "CLIENTES",
      items: [
        { value: "customers", label: "Clientes", icon: Users },
        { value: "notebook", label: "Solicitações", icon: Notebook, badge: pendingRequestsCount },
      ],
    },
    {
      category: "OUTROS",
      items: [
        { value: "coupons", label: "Cupons", icon: Ticket },
        { value: "recycle-bin", label: "Lixeira", icon: Trash2 },
        { value: "settings", label: "Configurações", icon: Settings },
      ],
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle>Menu Administrativo</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] px-3 py-4">
          <div className="space-y-6">
            {menuItems.map((section) => (
              <div key={section.category} className="space-y-1">
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {section.category}
                  </p>
                </div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.value;
                  return (
                    <Button
                      key={item.value}
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start gap-3 h-10"
                      onClick={() => handleTabChange(item.value)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            ))}

            <div className="pt-4 border-t border-border">
              <Button
                variant="destructive"
                className="w-full justify-start gap-3 h-10"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
