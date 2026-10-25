'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    document.body.style.overflow = '';
  };

  const isHome = pathname === '/';

  const getLinkHref = (hash: string) => {
    return isHome ? hash : `/${hash}`;
  };

  return (
    <>
      <nav id="nav" className={isScrolled ? 'scrolled' : ''}>
        <Link className="logo" href="/">Kō<em>sh</em></Link>
        <div className="nav-r">
          <ul className="nav-links">
            <li><Link href={getLinkHref('#cycle')}>28 days</Link></li>
            <li><Link href={getLinkHref('#plans')}>Plan</Link></li>
            <li><Link href={getLinkHref('#staples')}>Staples</Link></li>
            <li><Link href={getLinkHref('#delivery')}>Delivery</Link></li>
            <li>
              <Link 
                href="/apply" 
                className={`nav-apply ${pathname === '/apply' ? 'active' : ''}`}
              >
                Apply
              </Link>
            </li>
          </ul>
          <button 
            className={`nav-toggle ${isMenuOpen ? 'open' : ''}`} 
            onClick={toggleMobileMenu} 
            aria-label="Menu"
          >
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mob-menu ${isMenuOpen ? 'open' : ''}`}>
        <Link href={getLinkHref('#cycle')} onClick={closeMobileMenu}>28 days</Link>
        <Link href={getLinkHref('#plans')} onClick={closeMobileMenu}>Plan</Link>
        <Link href={getLinkHref('#staples')} onClick={closeMobileMenu}>Staples</Link>
        <Link href={getLinkHref('#delivery')} onClick={closeMobileMenu}>Delivery</Link>
        <Link href="/apply" onClick={closeMobileMenu}>Apply</Link>
      </div>
    </>
  );
}
