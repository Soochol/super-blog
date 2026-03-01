import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { Product, Review } from '@/types';
import BuyButtonCTA from '@/components/monetization/BuyButtonCTA';

interface ProductCardProps {
    product: Product;
    review?: Review;
    rank?: number;
}

export default function ProductCard({ product, review, rank }: ProductCardProps) {
    return (
        <div className="group flex flex-col bg-white border-4 border-black shadow-hard hover:shadow-hard-lg hover:-translate-y-1 hover:-translate-x-1 transition-all overflow-hidden relative">
            {/* Image Area */}
            <Link href={`/${product.categoryId}/${product.id}`} className="block relative aspect-[4/3] bg-white border-b-4 border-black overflow-hidden">
                {rank && (
                    <div className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center bg-neo-pink text-black text-xl font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {rank}
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={400}
                        height={300}
                        className="object-contain w-full h-full max-h-48 group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
            </Link>

            {/* Content Area */}
            <div className="flex flex-col flex-grow p-4 md:p-6 bg-white">
                <div className="mb-2">
                    <span className="text-xs font-black text-white bg-neo-blue px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">
                        {product.brand}
                    </span>
                </div>

                <Link href={`/${product.categoryId}/${product.id}`} className="block mb-3 mt-2">
                    <h3 className="text-xl font-black text-black leading-tight hover:underline decoration-4 underline-offset-4 line-clamp-2">
                        {product.name}
                    </h3>
                </Link>

                {review && (
                    <div className="flex items-center gap-2 mb-4 bg-neo-green/20 p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex text-black">
                            <Star className="w-5 h-5 fill-neo-yellow stroke-black stroke-2" />
                            <span className="ml-1 text-sm font-black text-black">{review.rating}</span>
                        </div>
                        <p className="text-sm text-black font-bold truncate w-full" title={review.summary}>
                            &ldquo;{review.summary}&rdquo;
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm font-bold text-black mb-6 bg-neo-yellow/20 p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="truncate"><span className="font-black mr-1 bg-black text-white px-1">CPU</span> {product.specs.cpu}</div>
                    <div className="truncate"><span className="font-black mr-1 bg-black text-white px-1">화면</span> {product.specs.display}</div>
                    <div className="truncate"><span className="font-black mr-1 bg-black text-white px-1">RAM</span> {product.specs.ram}</div>
                    <div className="truncate"><span className="font-black mr-1 bg-black text-white px-1">무게</span> {product.specs.weight}kg</div>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                    <div className="flex items-end justify-between w-full">
                        <span className="text-sm font-bold text-gray-500 line-through decoration-2">
                            {(product.price * 1.1).toLocaleString()}원
                        </span>
                        <span className="text-2xl font-black text-black leading-none tracking-tight">
                            {product.price.toLocaleString()}<span className="text-base ml-0.5">원~</span>
                        </span>
                    </div>
                    <BuyButtonCTA
                        url={product.couponUrl || '#'}
                        price={product.price}
                        variant="secondary"
                        size="lg"
                    />
                </div>
            </div>
        </div>
    );
}
