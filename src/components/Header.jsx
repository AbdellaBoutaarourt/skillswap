import { useState } from "react";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className=" flex items-center justify-between px-6 py-2 border-b border-white font-poppins relative">
      <div className="flex items-center space-x-2">
        <img src={logo} alt="Logo" />
      </div>
      {!menuOpen && (
        <button
          className="md:hidden text-white focus:outline-none z-20 cursor-pointer"
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      <nav className="hidden md:flex items-center space-x-6">
        <Link to="/" className="text-white hover:text-secondary font-medium border-b-2 border-transparent hover:border-white transition-all duration-150 text-lg">
          Home
        </Link>
        <a href="#" className="text-white hover:text-secondary font-medium border-b-2 border-transparent hover:border-white transition-all duration-150 text-lg">
          Explore
        </a>
        <Link to="/login" className="bg-button hover:bg-blue-700 text-white px-5 py-1.5 rounded-lg font-semibold focus:outline-none transition text-lg cursor-pointer">
          Sign In
        </Link>
      </nav>
      <div
        className={`fixed top-0 right-0 h-full w-3/4 max-w-xs bg-[#0a1218] p-6 flex flex-col space-y-6 shadow-lg z-30 transform transition-transform duration-300 md:hidden ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ willChange: 'transform' }}
      >
        <button
          className="absolute top-4 right-4 text-white z-40 cursor-pointer"
          onClick={() => setMenuOpen(false)}
          aria-label="Fermer le menu"
        >
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="mt-12 flex flex-col space-y-6">
          <Link to="/" className="text-white hover:text-secondary font-medium border-b-2 border-transparent hover:border-white transition-all duration-150 text-lg" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <a href="#" className="text-white hover:text-secondary font-medium border-b-2 border-transparent hover:border-white transition-all duration-150 text-lg" onClick={() => setMenuOpen(false)}>
            Explore
          </a>
          <Link to="/login" className="bg-button hover:bg-blue-700 cursor-pointer text-white px-5 py-1.5 rounded-lg font-semibold focus:outline-none transition text-lg" onClick={() => setMenuOpen(false)}>
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
