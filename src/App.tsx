import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Grid3X3, Ticket, FileText, LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Dashboard from "./components/Dashboard";
import MesaMap from "./components/MesaMap";
import SenhasModule from "./components/SenhasModule";
import Relatorios from "./components/Relatorios";
import Login from "./components/Login";
import { api } from "./services/api";

const Navigation = ({ onLogout }: { onLogout: () => void }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/mapa", label: "Mapa de Mesas", icon: Grid3X3 },
    { path: "/senhas", label: "Venda de Senhas", icon: Ticket },
    { path: "/relatorios", label: "Relatórios", icon: FileText },
  ];

  const logoUrl = "/assets/logo.png";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                <img 
                  src={logoUrl} 
                  alt="Lions Logo" 
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback if local logo is missing
                    (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Lions_Clubs_International_logo.svg/240px-Lions_Clubs_International_logo.svg.png";
                  }}
                />
              </div>
              <span className="font-bold text-xl text-gray-900 hidden sm:block">Lions Arcoverde</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-200 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut size={20} />
                Sair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("lions_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem("lions_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("lions_user");
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Carregando...</div>;

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {!user ? (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <>
            <Navigation onLogout={handleLogout} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/mapa" element={<MesaMap />} />
                <Route path="/senhas" element={<SenhasModule />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </>
        )}
      </div>
    </Router>
  );
}

