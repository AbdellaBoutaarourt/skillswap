const Header = () => {
  return (
    <header className="bg-white shadow p-4">
      <h1 className="text-2xl font-bold text-gray-800">Skillswap</h1>
      <nav className="mt-4">
        <ul className="flex space-x-6">
          <li>
            <a href="#" className="text-gray-700 hover:text-gray-900">
              Home
            </a>
          </li>
          <li>
            <a href="#" className="text-gray-700 hover:text-gray-900">
              Explore
            </a>
          </li>

          <li>
            <a href="#" className="text-gray-700 hover:text-gray-900">
              Profile
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
