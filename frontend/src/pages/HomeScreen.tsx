import { useState, useEffect, useRef } from 'react';
import { Search, Menu, Heart, Star, ChevronLeft, ChevronRight, HelpCircle, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomeScreen = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = [
    { label: 'Alojamientos', active: true },
    { label: 'Experiencias', active: false },
    { label: 'Servicios', active: false },
  ];

  const listings = [
    {
      id: 1,
      title: 'Apartamento en Santa Cruz de la Sierra',
      price: '$50 USD por 2 noches',
      rating: 5.0,
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop',
      tag: 'Favorito entre huéspedes'
    },
    {
      id: 2,
      title: 'Apartamento en Santa Cruz de la Sierra',
      price: '$74 USD por 2 noches',
      rating: 4.89,
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2080&auto=format&fit=crop',
      tag: 'Favorito entre huéspedes'
    },
    {
      id: 3,
      title: 'Apartamento en Centro',
      price: '$59 USD por 2 noches',
      rating: 4.94,
      image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=2070&auto=format&fit=crop',
      tag: 'Favorito entre huéspedes'
    },
    {
      id: 4,
      title: 'Alojamiento en Santa Cruz de la Sierra',
      price: '$428 USD por 2 noches',
      rating: 5.0,
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop',
      tag: ''
    },
    {
      id: 5,
      title: 'Apartamento en Santa Cruz de la Sierra',
      price: '$120 USD por 2 noches',
      rating: 4.96,
      image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2070&auto=format&fit=crop',
      tag: 'Favorito entre huéspedes'
    },
    {
      id: 6,
      title: 'Condo en Santa Cruz de la Sierra',
      price: '$36 USD por 2 noches',
      rating: 4.86,
      image: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?q=80&w=2070&auto=format&fit=crop',
      tag: ''
    },
    {
      id: 7,
      title: 'Apartamento en Santa Cruz de la Sierra',
      price: '$74 USD por 2 noches',
      rating: 4.84,
      image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=2074&auto=format&fit=crop',
      tag: 'Favorito entre huéspedes'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-6 md:px-12 lg:px-20 h-20 flex items-center justify-between transition-colors">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="text-primary">
             <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 fill-current">
                <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.01.415.001.228c0 4.062-2.877 6.478-6.357 6.478-2.224 0-4.556-1.258-6.709-3.386l-.257-.26-.172-.179h-.011l-.176.185c-2.044 2.1-4.39 3.641-6.719 3.641-3.47 0-6.347-2.413-6.347-6.478l.002-.228.012-.415c.05-.924.293-1.805.96-3.396l.145-.353c.986-2.296 5.146-11.006 7.1-14.836l.533-1.025C12.537 1.963 13.992 1 16 1zm0 2c-1.234 0-2.056.551-2.996 2.23l-.103.193C11.144 8.788 7.067 17.306 6.046 19.69l-.145.353c-.544 1.297-.713 1.967-.751 2.59l-.007.228v.228c0 2.982 2.108 4.478 4.347 4.478 1.451 0 3.107-.954 4.887-2.735l.176-.184.218.214c1.884 1.83 3.593 2.705 4.871 2.705 2.23 0 4.357-1.496 4.357-4.478l-.001-.228-.007-.228c-.038-.623-.207-1.293-.751-2.59l-.145-.353c-1.021-2.384-5.098-10.902-6.851-14.267l-.103-.193C18.056 3.551 17.234 3 16 3zm0 12.443a2.766 2.766 0 0 1 2.732 2.381l.034.202a2.766 2.766 0 0 1-5.532 0 2.766 2.766 0 0 1 2.766-2.583z"/>
             </svg>
          </div>
          <span className="text-primary font-bold text-xl hidden lg:block tracking-tighter">airbnb</span>
        </div>

        {/* Categories (Center) */}
        <div className="hidden md:flex items-center gap-8">
          {categories.map((cat) => (
            <div key={cat.label} className="relative group cursor-pointer py-2">
              <span className={`text-sm font-medium ${cat.active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                {cat.label}
              </span>
              {cat.active && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />}
            </div>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 relative" ref={menuRef}>
          <div 
            className="hidden lg:block text-sm font-semibold hover:bg-muted px-4 py-3 rounded-full cursor-pointer transition-colors mr-2"
          >
            Conviértete en anfitrión
          </div>
          {/* Theme Toggle (Replacing Globe) */}
          <button 
            onClick={toggleTheme}
            className="p-3 hover:bg-muted rounded-full cursor-pointer transition-all duration-300 active:scale-95"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-foreground animate-in fade-in zoom-in duration-300" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-500 animate-in fade-in zoom-in duration-300" />
            )}
          </button>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 bg-secondary hover:bg-muted rounded-full cursor-pointer transition-colors shadow-sm ml-2"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>

          {/* Popup Menu */}
          {isMenuOpen && (
            <div className="absolute top-14 right-0 w-[320px] bg-card text-card-foreground rounded-2xl shadow-2xl border border-border py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 hover:bg-muted cursor-pointer flex items-center gap-3 transition-colors">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Centro de ayuda</span>
              </div>
              <div className="border-t border-border" />
              <div 
                onClick={() => navigate('/login')}
                className="px-4 py-4 hover:bg-muted cursor-pointer flex justify-between items-start transition-colors"
              >
                <div>
                  <p className="text-[15px] font-bold">Conviértete en anfitrión</p>
                  <p className="text-[13px] text-muted-foreground mt-1 leading-tight">
                    Empieza a anfitrionar y genera ingresos adicionales, ¡es muy sencillo!
                  </p>
                </div>
              </div>
              <div className="border-t border-border" />
              <div className="px-4 py-3 hover:bg-muted cursor-pointer transition-colors">
                <span className="text-sm font-medium">Encuentra un coanfitrión</span>
              </div>
              <div className="border-t border-border" />
              <div 
                onClick={() => navigate('/login')}
                className="px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
              >
                <span className="text-sm font-bold">Iniciar sesión o registrarse</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Search Bar (Floating) */}
      <div className="pt-24 pb-8 flex justify-center">
        <div className="w-full max-w-4xl px-4">
          <div className="bg-card border border-border rounded-full shadow-lg h-16 flex items-center divide-x divide-border transition-colors">
            <div className="flex-1 px-8 py-2 hover:bg-muted rounded-l-full cursor-pointer group">
              <p className="text-xs font-bold text-foreground uppercase">Dónde</p>
              <p className="text-sm text-muted-foreground group-hover:text-foreground">Explora destinos</p>
            </div>
            <div className="flex-1 px-8 py-2 hover:bg-muted cursor-pointer group">
              <p className="text-xs font-bold text-foreground uppercase">Fechas</p>
              <p className="text-sm text-muted-foreground group-hover:text-foreground">Agrega fechas</p>
            </div>
            <div className="flex-1 px-8 py-2 hover:bg-muted rounded-r-full cursor-pointer group flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground uppercase">Quién</p>
                <p className="text-sm text-muted-foreground group-hover:text-foreground">¿Cuántos?</p>
              </div>
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white ml-4 shadow-lg shadow-primary/20">
                <Search className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="px-6 md:px-12 lg:px-20 pb-20">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 group cursor-pointer">
            <h2 className="text-2xl font-bold text-foreground">Alojamientos populares en Santa Cruz de la Sierra</h2>
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="flex gap-2">
            <button className="p-2 border border-border rounded-full hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 border border-border rounded-full hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((item) => (
            <div key={item.id} className="group cursor-pointer">
              <div className="relative aspect-square overflow-hidden rounded-2xl mb-3 bg-muted">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <button className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/20 transition-colors">
                  <Heart className="w-6 h-6 text-white stroke-[2px]" />
                </button>
                {item.tag && (
                  <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full text-[12px] font-bold shadow-sm border border-border">
                    {item.tag}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-foreground line-clamp-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{item.price}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-foreground" />
                  <span className="text-sm font-medium">{item.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Second Section Header */}
        <div className="flex items-center justify-between mt-16 mb-6">
          <div className="flex items-center gap-2 group cursor-pointer">
            <h2 className="text-2xl font-bold text-foreground">Disponibles cerca de Cochabamba este fin de semana</h2>
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Second Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {listings.slice(0, 4).map((item) => (
            <div key={`near-${item.id}`} className="group cursor-pointer">
              <div className="relative aspect-square overflow-hidden rounded-2xl mb-3 bg-muted">
                <img 
                  src={item.image.replace('2070', '2071')} // slight variant
                  alt={item.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <button className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/20 transition-colors">
                  <Heart className="w-6 h-6 text-white stroke-[2px]" />
                </button>
                <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full text-[12px] font-bold shadow-sm border border-border">
                    Favorito entre huéspedes
                  </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-foreground line-clamp-1">Habitación en Cochabamba</h3>
                  <p className="text-muted-foreground text-sm mt-1">$35 USD por noche</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-foreground" />
                  <span className="text-sm font-medium">4.95</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Button (Prices) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-card border border-border shadow-xl px-6 py-3 rounded-full flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform active:scale-95">
        <div className="w-5 h-5 text-primary">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="fill-current">
                <path d="M16 1a15 15 0 1 1 0 30 15 15 0 0 1 0-30zm0 2a13 13 0 1 0 0 26 13 13 0 0 0 0-26zm0 4a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10z"/>
            </svg>
        </div>
        <span className="text-sm font-bold">Los precios incluyen todas las tarifas</span>
      </div>
    </div>
  );
};

export default HomeScreen;
