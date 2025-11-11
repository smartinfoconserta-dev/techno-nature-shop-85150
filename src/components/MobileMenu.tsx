import { useState } from "react";
import { Menu, Home, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import AdminLoginDialog from "./AdminLoginDialog";

const MobileMenu = () => {
  const navigate = useNavigate();
  const [showAdminDialog, setShowAdminDialog] = useState(false);

  const menuItems = [
    { icon: Home, label: "Início", path: "/", action: "navigate" },
    { icon: Users, label: "Parceiros", path: "/login", action: "navigate" },
    { icon: Settings, label: "Administração", path: "", action: "admin" },
  ];

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.action === "admin") {
      setShowAdminDialog(true);
    } else {
      navigate(item.path);
    }
  };

  return (
    <>
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
            {menuItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="justify-start gap-3 h-12"
                onClick={() => handleMenuClick(item)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <AdminLoginDialog 
        open={showAdminDialog} 
        onOpenChange={setShowAdminDialog} 
      />
    </>
  );
};

export default MobileMenu;
