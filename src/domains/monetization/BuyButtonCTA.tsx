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

    const baseStyles = "inline-flex items-center justify-center font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variantStyles = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow",
        secondary: "bg-[#FF9B00] text-white hover:bg-[#E58C00] focus:ring-[#FF9B00] shadow-sm hover:shadow", // Coupang Orange
        outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500"
    };

    const sizeStyles = {
        sm: "px-3 py-1.5 text-sm gap-1.5",
        md: "px-5 py-2.5 text-base gap-2",
        lg: "px-8 py-3.5 text-lg gap-2.5 w-full"
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
