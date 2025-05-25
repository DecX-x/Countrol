'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed w-full top-0 z-50 px-4 py-2"
    >
      <nav className="glass-effect max-w-7xl mx-auto rounded-button px-4 py-3 flex items-center justify-between">        <Link href="/" className="hidden sm:flex items-center space-x-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-10 h-10 rounded-full overflow-hidden"
          >
          </motion.div>
          <span className="text-2xl font-bold gradient-text">Countrol.</span>
        </Link>

        {/* Mobile logo - simplified */}
        <Link href="/" className="sm:hidden">
          <span className="text-lg font-bold gradient-text">C.</span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          <Link href="/tracker" className="text-white/80 hover:text-white transition-colors">
            Tracker
          </Link>
          <Link href="/features" className="text-white/80 hover:text-white transition-colors">
            Chat
          </Link>
          <Link href="/about" className="text-white/80 hover:text-white transition-colors">
            About
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search button - hidden on mobile */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-full glass-effect hidden sm:block"
          >
            <Search className="w-5 h-5 text-white/80 hover:text-white" />
          </motion.button>
          
          {/* Mobile menu button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="md:hidden p-2 rounded-full glass-effect"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-white/80" />
            ) : (
              <Menu className="w-5 h-5 text-white/80" />
            )}
          </motion.button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden mt-2 mx-4"
        >
          <div className="glass-effect rounded-button px-4 py-3 space-y-3">
            <Link 
              href="/tracker" 
              className="block text-white/80 hover:text-white transition-colors py-2"
              onClick={closeMobileMenu}
            >
              Tracker
            </Link>
            <Link 
              href="/search" 
              className="block text-white/80 hover:text-white transition-colors py-2"
              onClick={closeMobileMenu}
            >
              Chat
            </Link>
            <Link 
              href="/about" 
              className="block text-white/80 hover:text-white transition-colors py-2"
              onClick={closeMobileMenu}
            >
              About
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}