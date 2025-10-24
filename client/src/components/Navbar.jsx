import React, { useState, useEffect } from 'react';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../features/authSlice';
import { toast } from 'react-hot-toast';

const Navbar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const user = useSelector((state) => state.auth.user);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const closeMenu = () => setIsMobileMenuOpen(false);

  // Logout handler
  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('Logged out successfully');
      closeMenu();
    } catch (error) {
      toast.error(error || 'Logout failed');
    }
  };

  // Navigation links
  const navLinks = [
    { to: '/', text: 'Home' },
    { to: '/about', text: 'About' },
    { to: '/testimonials', text: 'Testimonials' },
    { to: '/faq', text: 'FAQ' },
    { to: '/provider', text: 'Providers' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 h-16 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/20 backdrop-blur-md border-b border-gray-300 shadow-sm'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="max-w-[1370px] mx-auto px-3 sm:px-6 lg:px-8 h-full flex items-center justify-between relative">
        {/* Logo */}
        <div className="flex">
          <Link
            to="/"
            className="text-[1.4rem] font-bold tracking-tight flex items-center gap-0.5 text-gray-800"
          >
            <img src="newFevicon.png" className="h-6" alt="" />
            SOCIETY
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center font-semibold text-[0.94rem] space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-gray-800 hover:text-blue-700 transition-colors duration-200 tracking-wide cursor-pointer"
            >
              {link.text}
            </Link>
          ))}
        </div>

        {/* Desktop Buttons */}
        {!user ? (
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/login"
              className="text-white rounded-lg px-4 py-1 bg-blue-500 transition-all duration-300 shadow-lg"
            >
              Login
            </Link>
          </div>
        ) : (
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="text-white rounded-lg px-4 py-1 hover:cursor-pointer bg-blue-500 transition-all duration-300 shadow-lg"
            >
              Logout
            </button>
          </div>
        )}

        {/* Mobile Toggle Button */}
        <button
          className="md:hidden text-gray-700 focus:outline-none z-60"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <HiOutlineX size={28} /> : <HiOutlineMenu size={28} />}
        </button>
      </nav>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeMenu}
        />
      )}

      {/* Slide-in Mobile Menu */}
      <div
        className={`md:hidden fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-50 transform transition-transform duration-500 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-start px-6 py-5 border-b border-gray-200 bg-linear-to-r from-blue-50 to-purple-50">
          <Link to="/" onClick={closeMenu} className="text-xl font-bold tracking-tight text-gray-700">
            SOCIETY
          </Link>
        </div>

        {/* Menu Content */}
        <div className="flex flex-col h-[calc(100%-73px)] overflow-y-auto">
          {/* Links */}
          <div className="flex-1 py-6 px-6 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 font-medium"
              >
                {link.text}
              </Link>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-6 border-t border-gray-200 bg-gray-50 space-y-3">
            {!user ? (
              <Link
                to="/login"
                onClick={closeMenu}
                className="block w-full text-center text-white rounded-lg px-4 py-3 bg-blue-500 transition-all duration-300 shadow-lg font-medium"
              >
                Login
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="block w-full text-center hover:cursor-pointer text-white rounded-lg px-4 py-3 bg-blue-500 transition-all duration-300 shadow-lg font-medium"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
