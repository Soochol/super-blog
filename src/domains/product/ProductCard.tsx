import Link from 'next/link';
import { Star } from 'lucide-react';
import { Product, Review } from '@/types';
import BuyButtonCTA from '@/domains/monetization/BuyButtonCTA';

interface ProductCardProps {
    product: Product;
    review?: Review;
    rank?: number;
}

export default function ProductCard({ product, review, rank }: ProductCardProps) {
    return (
        <div className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
            {/* Image Area */}
            <Link href={`/${product.categoryId}/${product.id}`} className="block relative aspect-[4/3] bg-gray-50 overflow-hidden">
                {rank && (
                    <div className="absolute top-4 left-4 z-10 w-8 h-8 flex items-center justify-center bg-gray-900 text-white font-bold rounded-full shadow-lg">
                        {rank}
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="object-contain w-full h-full max-h-48 group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
            </Link>

            {/* Content Area */}
            <div className="flex flex-col flex-grow p-5 md:p-6">
                <div className="mb-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                        {product.brand}
                    </span>
                </div>

                <Link href={`/${product.categoryId}/${product.id}`} className="block mb-3">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                        {product.name}
                    </h3>
                </Link>

                {review && (
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex text-[#FF9B00]">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="ml-1 text-sm font-bold text-gray-700">{review.rating}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate w-full" title={review.summary}>
                            "{review.summary}"
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg">
                    <div className="truncate"><span className="font-semibold text-gray-400 mr-1">CPU</span> {product.specs.cpu}</div>
                    <div className="truncate"><span className="font-semibold text-gray-400 mr-1">화면</span> {product.specs.display}</div>
                    <div className="truncate"><span className="font-semibold text-gray-400 mr-1">RAM</span> {product.specs.ram}</div>
                    <div className="truncate"><span className="font-semibold text-gray-400 mr-1">무게</span> {product.specs.weight}kg</div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 line-through decoration-gray-300">
                            {(product.price * 1.1).toLocaleString()}원
                        </span>
                        <span className="text-xl font-extrabold text-gray-900 leading-none tracking-tight">
                            {product.price.toLocaleString()}<span className="text-sm font-medium ml-0.5">원~</span>
                        </span>
                    </div>
                    <BuyButtonCTA
                        url={product.couponUrl || '#'}
                        price={product.price}
                        variant="secondary"
                        size="md"
                        className="flex-shrink-0"
                    />
                </div>
            </div>
        </div>
    );
}
