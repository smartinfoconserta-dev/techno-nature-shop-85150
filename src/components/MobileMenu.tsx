import { Menu, Home, ShoppingBag, Users, Download, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";

const MobileMenu = () => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: Home, label: "Início", path: "/" },
    { icon: ShoppingBag, label: "Produtos", path: "/" },
    { icon: Users, label: "Parceiros", path: "/login" },
    { icon: Download, label: "Instalar App", path: "/install" },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 mt-6">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className="justify-start gap-3 h-12"
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
