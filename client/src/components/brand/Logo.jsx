import React from 'react';
import { BRAND } from '../../config/brand';

/**
 * Premium Brand Logo Component
 */
export default function Logo({ variant = 'full', className = '', animated = false }) {
  const handleImgError = (e) => {
    e.target.onerror = null;
    e.target.src = '/logo.png';
  };

  return (
    <div className={`flex items-center gap-2 ${variant === 'symbol' ? 'justify-center' : ''}`}>
      <img 
        src="/brand/logo-512.webp"
        alt={`${BRAND.fullName} - ${BRAND.tagline}`}
        onError={handleImgError}
        className={`w-10 h-10 sm:w-12 sm:h-12 drop-shadow-md object-contain ${animated ? 'hover:scale-105 transition-transform' : ''} ${className}`}
      />
      {variant === 'full' && (
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-red-400">
            {BRAND.name}
          </span>
          <span className="text-[0.65rem] font-bold text-gray-500 tracking-widest uppercase mt-0.5 hidden sm:block">
            .{BRAND.domain}
          </span>
        </div>
      )}
    </div>
  );
}
