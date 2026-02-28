import Link from 'next/link';
import { Search, Menu } from 'lucide-react';

export default function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b-4 border-black bg-white">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl font-black text-black bg-neo-yellow px-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            SUPER BLOG
                        </span>
                    </Link>
                    <nav className="hidden md:flex gap-6">
                        <Link href="/laptop" className="text-base font-bold text-black hover:text-neo-pink transition-colors">
                            노트북 리뷰
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-black" />
                        <input
                            type="search"
                            placeholder="제품 검색..."
                            className="h-10 w-64 border-2 border-black bg-white pl-10 pr-4 text-sm font-bold text-black outline-none focus:bg-neo-blue/10 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-500"
                        />
                    </div>
                    <button className="md:hidden p-2 text-black hover:bg-neo-yellow border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                        <Menu className="h-6 w-6 font-bold" />
                    </button>
                </div>
            </div>
        </header>
    );
}
