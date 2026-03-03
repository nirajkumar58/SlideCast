import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';

function Navbar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/upload', label: 'Convert' },
    { path: '/about', label: 'How It Works' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-secondary-900/90 backdrop-blur-md border-b border-secondary-200 dark:border-secondary-800 shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-500 text-white transition-all duration-300 group-hover:rotate-3 group-hover:scale-110">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-secondary-900 dark:text-white">
                <span className="gradient-text">SlideCast</span>
              </span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <div className="flex space-x-6">
              {navLinks.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`inline-flex items-center px-1 py-2 text-sm font-medium transition-colors duration-200 ${
                    location.pathname === path
                      ? 'text-primary-600 dark:text-primary-400 font-semibold'
                      : 'text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  {label}
                  {location.pathname === path && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-full"></span>
                  )}
                </Link>
              ))}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-secondary-500 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>
              
              <Link
                to="/upload"
                className="btn-primary btn-sm"
              >
                Start Converting
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-secondary-500 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 mr-2"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-secondary-500 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={`sm:hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1 border-t border-secondary-200 dark:border-secondary-800">
          {navLinks.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                location.pathname === path
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 hover:text-primary-600 dark:hover:text-primary-400'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="px-3 py-3">
            <Link
              to="/upload"
              className="w-full btn-primary text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start Converting
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 