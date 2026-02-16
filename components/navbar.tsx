'use client';

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import LogoIcon from '@/components/logo-icon';
import AuthButton from '@/components/auth-button';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 text-indigo-600">
              <LogoIcon />
            </div>
            <span className="text-xl font-bold text-gray-900">MockData</span>
          </Link>

          <div className="flex items-center gap-8 mx-auto">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-indigo-600 ${
                isActive('/') ? 'text-indigo-600' : 'text-gray-600'
              }`}
            >
              Home
            </Link>
            <Link
              href="/solutions"
              className={`text-sm font-medium transition-colors hover:text-indigo-600 ${
                isActive('/solutions') ? 'text-indigo-600' : 'text-gray-600'
              }`}
            >
              Solutions
            </Link>
            <Link
              href="/pricing"
              className={`text-sm font-medium transition-colors hover:text-indigo-600 ${
                isActive('/pricing') ? 'text-indigo-600' : 'text-gray-600'
              }`}
            >
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <AuthButton />
            <Link href="/app">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
