"use client";

import React, { useState, useEffect } from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Avatar({ src, name, size = 38, className, style }: AvatarProps) {
  const fallbackSrc = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=1e3a8a&textColor=ffffff`;
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setImgSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img 
      src={imgSrc} 
      onError={() => { if (imgSrc !== fallbackSrc) setImgSrc(fallbackSrc); }}
      alt="Avatar" 
      referrerPolicy="no-referrer"
      className={className}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        borderRadius: '50%', 
        objectFit: 'cover',
        ...style 
      }} 
    />
  );
}
