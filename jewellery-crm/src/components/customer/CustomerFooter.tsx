'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function CustomerFooter() {
  const params = useParams();
  const tenant = params.tenant as string;

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="text-2xl font-bold">💎 Jewellery Store</div>
            <p className="text-gray-300 leading-relaxed">
              Discover exquisite jewellery crafted with precision and designed for elegance. 
              From traditional to contemporary, find pieces that tell your story.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gold hover:text-gray-900 transition-all duration-200">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gold hover:text-gray-900 transition-all duration-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gold hover:text-gray-900 transition-all duration-200">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gold hover:text-gray-900 transition-all duration-200">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/store/${tenant}`} className="text-gray-300 hover:text-gold transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href={`/store/${tenant}/collections`} className="text-gray-300 hover:text-gold transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link href={`/store/${tenant}/about`} className="text-gray-300 hover:text-gold transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href={`/store/${tenant}/contact`} className="text-gray-300 hover:text-gold transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href={`/store/${tenant}/blog`} className="text-gray-300 hover:text-gold transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/store/${tenant}/help`} className="text-gray-300 hover:text-gold transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href={`/store/${tenant}/shipping`} className="text-gray-300 hover:text-gold transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href={`/store/${tenant}/returns`} className="text-gray-300 hover:text-gold transition-colors">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href={`/store/${tenant}/size-guide`} className="text-gray-300 hover:text-gold transition-colors">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link href={`/store/${tenant}/care-instructions`} className="text-gray-300 hover:text-gold transition-colors">
                  Care Instructions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-gray-300">+91 98765 43210</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-gray-300">support@jewellerystore.com</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-gray-300">123 Jewellery Street, Mumbai, Maharashtra 400001</p>
                </div>
              </div>
            </div>

            {/* Newsletter */}
            <div className="mt-6">
              <h4 className="font-medium mb-2">Newsletter</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                />
                <button className="px-4 py-2 bg-gold text-gray-900 rounded-r-lg hover:bg-yellow-500 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-300 text-sm">
              © 2024 Jewellery Store. All rights reserved.
            </div>
            
            <div className="flex space-x-6 text-sm">
              <Link href={`/store/${tenant}/privacy`} className="text-gray-300 hover:text-gold transition-colors">
                Privacy Policy
              </Link>
              <Link href={`/store/${tenant}/terms`} className="text-gray-300 hover:text-gold transition-colors">
                Terms of Service
              </Link>
              <Link href={`/store/${tenant}/sitemap`} className="text-gray-300 hover:text-gold transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-gray-800 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center space-x-8 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <span className="text-gold">✓</span>
              <span>BIS Hallmarked</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gold">✓</span>
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gold">✓</span>
              <span>Free Shipping</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gold">✓</span>
              <span>30-Day Returns</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gold">✓</span>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 