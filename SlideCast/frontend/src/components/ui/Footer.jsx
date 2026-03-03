import React from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

function Footer() {
  const currentYear = new Date().getFullYear();
  
  const navigation = {
    main: [
      { name: 'Home', href: '/' },
      { name: 'Convert', href: '/upload' },
      { name: 'How It Works', href: '/about' },
      { name: 'Features', href: '/#features' },
    ],
    social: [
      {
        name: 'Twitter',
        href: 'https://twitter.com/slidecast',
        icon: (props) => (
          <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
          </svg>
        ),
      },
      {
        name: 'GitHub',
        href: 'https://github.com/slidecast',
        icon: (props) => (
          <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
        ),
      },
      {
        name: 'Email',
        href: 'mailto:support@slidecast.com',
        icon: (props) => <EnvelopeIcon {...props} />,
      },
      {
        name: 'Website',
        href: 'https://slidecast.com',
        icon: (props) => <GlobeAltIcon {...props} />,
      },
    ],
  };

  return (
    <footer className="bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-800">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand and Description */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-500 text-white">
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
            </div>
            <p className="text-secondary-600 dark:text-secondary-300 max-w-md">
              Transform your presentations into engaging audio narratives with our advanced AI-powered conversion tool. Perfect for learning, accessibility, and engaging content delivery.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {navigation.main.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-base text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white uppercase tracking-wider mb-4">
              Connect With Us
            </h3>
            <div className="flex space-x-4">
              {navigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary-500 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors duration-200"
                  aria-label={item.name}
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-secondary-200 dark:border-secondary-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-base text-secondary-500 dark:text-secondary-400">
            &copy; {currentYear} SlideCast. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="#" className="text-sm text-secondary-500 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-secondary-500 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-secondary-500 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 