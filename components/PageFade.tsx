'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
export default function PageFade({ children }: {children: React.ReactNode}) {
  const key = usePathname();
  return <div key={key} className="cc-page-fade">{children}</div>;
}
