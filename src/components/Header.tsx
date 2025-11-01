import heroBanner from "@/assets/hero-banner.jpg";

const Header = () => {
  return (
    <header className="relative h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBanner})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
      </div>
      
      <div className="relative z-10 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
          Ramon Casagrande
        </h1>
        <p className="text-lg md:text-xl text-white/90 drop-shadow-md">
          Catálogo Digital de Tecnologia
        </p>
      </div>
    </header>
  );
};

export default Header;
