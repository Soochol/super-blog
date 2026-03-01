'use client';

import Link from 'next/link';
import { Search, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/laptop', label: '노트북 리뷰' },
  { href: '/laptop/rank/price', label: '랭킹' },
  { href: '/guide/gaming-laptop-guide', label: '가이드' },
  { href: '/admin', label: '관리자' },
] as const;

interface SearchResult {
  id: string;
  name: string;
  categoryId: string | null;
  imageUrl: string | null;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.length < 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) return;
        setResults(await res.json());
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    setQuery('');
    setResults([]);
    if (result.categoryId) {
      router.push(`/${result.categoryId}/${result.id}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b-4 border-black bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black text-black bg-neo-yellow px-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                SUPER BLOG
              </span>
            </Link>
            <nav className="hidden md:flex gap-6">
              {NAV_ITEMS.map(({ href, label }) => (
                <Link key={href} href={href} className="text-base font-bold text-black hover:text-neo-pink transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-black" />
              <input
                type="search"
                placeholder="제품 검색..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-64 border-2 border-black bg-white pl-10 pr-4 text-sm font-bold text-black outline-none focus:bg-neo-blue/10 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-500"
              />
              {(results.length > 0 || isSearching) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-4 border-black shadow-hard z-50">
                  {isSearching && (
                    <div className="px-4 py-3 text-sm font-bold text-black">검색 중...</div>
                  )}
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleResultClick(r)}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-black hover:bg-neo-yellow border-b-2 border-black last:border-b-0 transition-colors"
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 text-black hover:bg-neo-yellow border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              aria-label="메뉴 열기"
            >
              <Menu className="h-6 w-6 font-bold" />
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 메뉴 오버레이 */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} />
          <nav className="absolute right-0 top-0 h-full w-72 bg-white border-l-4 border-black flex flex-col">
            <div className="flex items-center justify-between p-4 border-b-4 border-black">
              <span className="text-xl font-black text-black bg-neo-yellow px-2 border-2 border-black">MENU</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 border-2 border-black hover:bg-neo-pink transition-colors"
                aria-label="메뉴 닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col p-4 gap-2">
              {NAV_ITEMS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 text-base font-black text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-yellow transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
