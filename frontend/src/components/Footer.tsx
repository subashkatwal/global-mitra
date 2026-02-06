import { motion } from 'framer-motion';
import { 
  Compass, Facebook, Instagram, Twitter, Youtube,
  MapPin, Mail, Phone
} from 'lucide-react';

const footerLinks = {
  platform: [
    { label: 'Explore', href: '#' },
    { label: 'Features', href: '#' },
    { label: 'Pricing', href: '#' },
    { label: 'Mobile App', href: '#' }
  ],
  community: [
    { label: 'Guidelines', href: '#' },
    { label: 'Community Leaders', href: '#' },
    { label: 'Events', href: '#' },
    { label: 'Blog', href: '#' }
  ],
  support: [
    { label: 'Help Center', href: '#' },
    { label: 'Contact Us', href: '#' },
    { label: 'Safety', href: '#' },
    { label: 'Status', href: '#' }
  ]
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Youtube, href: '#', label: 'YouTube' }
];

export function Footer() {
  return (
    <footer className="bg-[#2C3E50] text-white">
      {/* Wave Divider */}
      <div className="relative h-16 -mt-16 overflow-hidden">
        <svg 
          viewBox="0 0 1440 64" 
          fill="none" 
          className="absolute bottom-0 w-full"
          preserveAspectRatio="none"
        >
          <path 
            d="M0 64L48 58.7C96 53 192 43 288 37.3C384 32 480 32 576 37.3C672 43 768 53 864 53.3C960 53 1056 43 1152 37.3C1248 32 1344 32 1392 32L1440 32V64H1392C1344 64 1248 64 1152 64C1056 64 960 64 864 64C768 64 672 64 576 64C480 64 384 64 288 64C192 64 96 64 48 64H0Z" 
            fill="#2C3E50"
          />
        </svg>
      </div>

      <div className="section-padding py-16">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Compass className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-heading text-2xl font-bold">Global Mitra</h3>
                  <p className="text-white/60 text-sm">Travel Verified, Memories Shared</p>
                </div>
              </motion.div>
              
              <p className="text-white/70 mb-6 max-w-sm">
                Connecting travelers worldwide through verified experiences and authentic community-driven discoveries.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/70">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">San Francisco, California</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">hello@globalmitra.com</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">+1 (555) 123-4567</span>
                </div>
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Platform</h4>
              <ul className="space-y-3">
                {footerLinks.platform.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-white/70 hover:text-[#FF6B35] transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Community</h4>
              <ul className="space-y-3">
                {footerLinks.community.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-white/70 hover:text-[#FF6B35] transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Support</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-white/70 hover:text-[#FF6B35] transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Copyright */}
              <p className="text-white/50 text-sm">
                © 2024 Global Mitra. All rights reserved.
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#FF6B35] transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>

              {/* Legal Links */}
              <div className="flex items-center gap-6 text-sm">
                <a href="#" className="text-white/50 hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-white/50 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
