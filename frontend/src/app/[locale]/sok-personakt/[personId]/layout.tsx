import React from 'react';

export default function PersonaktLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex-grow pt-40">{children}</div>;
}
