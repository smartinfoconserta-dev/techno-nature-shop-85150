import { useState } from "react";
import { Settings, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";
import AdminLoginDialog from "./AdminLoginDialog";
import { Button } from "./ui/button";
const Header = () => {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const navigate = useNavigate();

  return <header className="relative h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{
      backgroundImage: `url(${heroBanner})`
    }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
      </div>
      
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/customer-login')}
          className="opacity-80 hover:opacity-100 transition-opacity text-white border border-white/20 hover:bg-white/10"
        >
          <span>Parceiros</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/install')}
          className="opacity-80 hover:opacity-100 transition-opacity text-white border border-white/20 hover:bg-white/10"
        >
          <Download className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Instalar App</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowLoginDialog(true)} 
          className="opacity-30 hover:opacity-100 transition-opacity"
        >
          <Settings className="h-5 w-5 text-white" />
        </Button>
      </div>
      
      <div className="relative z-10 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">Ramon Tech Solutions</h1>
        <p className="text-lg md:text-xl text-white/90 drop-shadow-md">
          Catálogo Digital de Tecnologia
        </p>
      </div>

      <AdminLoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </header>;
};
export default Header;