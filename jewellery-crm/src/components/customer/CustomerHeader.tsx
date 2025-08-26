'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Category } from '@/lib/api-service';
import { getTenantConfig } from '@/lib/tenant-config';
import { Search, ShoppingBag, User, Menu, X } from 'lucide-react';

interface CustomerHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export default function CustomerHeader({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange
}: CustomerHeaderProps) {
  const params = useParams();
  const tenant = params.tenant as string;
  const tenantConfig = getTenantConfig(tenant);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartItemCount] = useState(0); // This will be connected to cart state

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      {/* Top bar */}
      <div className="bg-gray-900 text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <span>📞 {tenantConfig.contact.phone}</span>
              <span>📧 {tenantConfig.contact.email}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href={`/store/${tenant}/account`} className="hover:text-gold transition-colors">
                <User className="w-4 h-4 inline mr-1" />
                Account
              </Link>
              <Link href={`/store/${tenant}/orders`} className="hover:text-gold transition-colors">
                Orders
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={`/store/${tenant}`} className="text-2xl font-bold text-gray-900">
            {tenantConfig.logo} {tenantConfig.displayName}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href={`/store/${tenant}`} className="text-gray-700 hover:text-gold transition-colors">
              Home
            </Link>
            <div className="relative group">
              <button className="text-gray-700 hover:text-gold transition-colors flex items-center">
                Categories
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-white shadow-lg rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => onCategoryChange(category.name)}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gold transition-colors"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
            <Link href={`/store/${tenant}/collections`} className="text-gray-700 hover:text-gold transition-colors">
              Collections
            </Link>
            <Link href={`/store/${tenant}/about`} className="text-gray-700 hover:text-gold transition-colors">
              About
            </Link>
            <Link href={`/store/${tenant}/contact`} className="text-gray-700 hover:text-gold transition-colors">
              Contact
            </Link>
          </nav>

          {/* Search and Cart */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search for jewellery..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent w-64"
              />
            </div>

            {/* Cart */}
            <Link href={`/store/${tenant}/cart`} className="relative">
              <ShoppingBag className="w-6 h-6 text-gray-700 hover:text-gold transition-colors" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search for jewellery..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <nav className="space-y-4">
              <Link href={`/store/${tenant}`} className="block text-gray-700 hover:text-gold transition-colors">
                Home
              </Link>
              <div>
                <div className="text-gray-700 font-medium mb-2">Categories</div>
                <div className="space-y-2 pl-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        onCategoryChange(category.name);
                        setIsMobileMenuOpen(false);
                      }}
                      className="block text-gray-600 hover:text-gold transition-colors"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
              <Link href={`/store/${tenant}/collections`} className="block text-gray-700 hover:text-gold transition-colors">
                Collections
              </Link>
              <Link href={`/store/${tenant}/about`} className="block text-gray-700 hover:text-gold transition-colors">
                About
              </Link>
              <Link href={`/store/${tenant}/contact`} className="block text-gray-700 hover:text-gold transition-colors">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
} 