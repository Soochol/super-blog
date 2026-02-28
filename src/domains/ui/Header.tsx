import Link from 'next/link';
import { Search, Menu } from 'lucide-react';

export default function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Super Blog
                        </span>
                    </Link>
                    <nav className="hidden md:flex gap-6">
                        <Link href="/laptop" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                            노트북 추천
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="search"
                            placeholder="제품 검색..."
                            className="h-9 w-64 rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>
                    <button className="md:hidden p-2 text-gray-600 hover:text-gray-900">
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
