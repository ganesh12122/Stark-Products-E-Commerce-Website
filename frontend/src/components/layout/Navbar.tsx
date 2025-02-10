import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-bold text-xl">Stark Products</Link>
          <div className="flex space-x-4">
            <Link to="/" className="hover:text-gray-300">Home</Link>
            <Link to="/categories" className="hover:text-gray-300">Categories</Link>
            <Link to="/cart" className="hover:text-gray-300">Cart</Link>
            <Link to="/user/login" className="hover:text-gray-300">User Login</Link>
            <Link to="/admin/login" className="hover:text-gray-300">Admin Login</Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 