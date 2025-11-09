import { useState } from "react";
import { Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLoginDialog from "./AdminLoginDialog";
import MobileMenu from "./MobileMenu";
import SearchBar from "./SearchBar";

interface HeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

const Header = ({ searchValue, onSearchChange }: HeaderProps) => {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <MobileMenu />
          
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-lg font-bold text-foreground whitespace-nowrap hidden sm:block">
              Ramon Tech
            </h1>
            <h1 className="text-lg font-bold text-foreground whitespace-nowrap sm:hidden">
              RT
            </h1>
          </div>
          
          <SearchBar 
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Buscar produtos..."
          />
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <User className="h-5 w-5 text-foreground" />
            </button>
            
            <button
              onClick={() => setShowLoginDialog(true)}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors opacity-30 hover:opacity-100"
            >
              <Settings className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>
      </header>

      <AdminLoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </>
  );
};

export default Header;