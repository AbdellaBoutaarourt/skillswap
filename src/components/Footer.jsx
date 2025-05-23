import logo from '../assets/logo.png';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="bg-[#111B23] border-t border-gray-700 pt-8 pb-4 px-4 md:px-0 mt-12">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-0">
      <div className="flex flex-col items-start">
        <div className="flex items-center mb-2">
          <img src={logo} alt="SkillSwap Logo" />
        </div>
        <p className="text-gray-400 text-sm max-w-xs">Exchange skills, grow together, build community.</p>
      </div>
      <div className="flex flex-col items-start md:items-end">
        <span className="text-white font-semibold text-lg mb-2">Navigation</span>
        <nav className="flex flex-col space-y-1 text-sm">
          <Link to="/" className="text-gray-200 hover:text-blue-400 transition">Home</Link>
          <Link to="#" className="text-gray-200 hover:text-blue-400 transition">Explore</Link>
          <Link to="#" className="text-gray-200 hover:text-blue-400 transition">Skill Mashups</Link>
          <Link to="/login" className="text-gray-200 hover:text-blue-400 transition">Sign up</Link>
        </nav>
      </div>
    </div>
    <div className="text-center text-gray-500 text-xs mt-8">© 2025 SkillSwap. All rights reserved.</div>
  </footer>
);

export default Footer;