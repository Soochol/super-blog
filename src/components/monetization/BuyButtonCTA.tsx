"use client";

import { ShoppingCart } from 'lucide-react';

interface BuyButtonCTAProps {
    url: string;
    price: number;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function BuyButtonCTA({
    url,
    price,
    variant = 'primary',
    size = 'md',
    className = ''
}: BuyButtonCTAProps) {

    const baseStyles = "inline-flex flex-col items-center justify-center font-black border-4 border-black text-black shadow-hard uppercase transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-hard-lg active:translate-y-1 active:translate-x-1 active:shadow-none focus:outline-none focus:ring-4 focus:ring-black focus:ring-offset-2";

    const variantStyles = {
        primary: "bg-neo-pink hover:bg-pink-400",
        secondary: "bg-neo-orange hover:bg-orange-400",
        outline: "bg-white hover:bg-gray-100"
    };

    const sizeStyles = {
        sm: "px-4 py-2 text-sm gap-2",
        md: "px-6 py-3 text-base gap-2",
        lg: "px-8 py-4 text-xl gap-3 w-full"
    };

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            onClick={() => {
                // Here we will add GA/GTM event tracking in the future
                // console.log('CTA Clicked', { url, price });
            }}
        >
            <ShoppingCart className={size === 'sm' ? "w-4 h-4" : size === 'lg' ? "w-6 h-6" : "w-5 h-5"} />
            <span className="flex flex-col items-center leading-none">
                <span>최저가 보러가기</span>
                {size === 'lg' && (
                    <span className="text-xs opacity-90 mt-1 font-medium block">
                        {price.toLocaleString()}원~
                    </span>
                )}
            </span>
        </a>
    );
}
