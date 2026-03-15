import React from 'react';

interface YukthaLogoProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function YukthaLogo({ size = 'md', className = '' }: YukthaLogoProps) {
    const sizeClasses = {
        sm: 'text-2xl',
        md: 'text-4xl',
        lg: 'text-5xl md:text-6xl',
    };

    const dotSizes = {
        sm: 'w-[5px] h-[5px] ml-[2px] mb-[2px]',
        md: 'w-[7px] h-[7px] ml-1 mb-[2px]',
        lg: 'w-[8px] h-[8px] md:w-[10px] md:h-[10px] ml-1 mb-[5px] md:mb-[8px]',
    };

    return (
        <h1 className={`font-playfair italic font-black text-[#02B69A] tracking-tighter flex items-end justify-center ${sizeClasses[size]} ${className}`}>
            yuktha
            <span className={`inline-block bg-[#00D4AA] rounded-full ${dotSizes[size]}`}></span>
        </h1>
    );
}
