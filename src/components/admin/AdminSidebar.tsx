import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  DollarSign,
  BarChart3,
  History,
  Zap,
  Tags,
  FolderOpen,
  Ticket,
  Settings,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  value: string;
  icon: any;
}

const navItems: NavItem[] = [
  { title: "Dashboard", value: "dashboard", icon: LayoutDashboard },
  { title: "Produtos", value: "products", icon: Package },
  { title: "Vendas Rápidas", value: "quick-sales", icon: Zap },
  { title: "Caderneta", value: "receivables", icon: DollarSign },
  { title: "Financeiro", value: "finance", icon: BarChart3 },
  { title: "Histórico", value: "history", icon: History },
  { title: "Cupons", value: "coupons", icon: Ticket },
  { title: "Configurações", value: "settings", icon: Settings },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.value;
                
                return (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.value)}
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
