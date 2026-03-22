import { ReactNode } from 'react';

export const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <header className="bg-white border-b h-16 flex items-center px-6">
      <h1 className="font-bold text-xl">Learning Platform</h1>
    </header>
    <main className="flex-1">{children}</main>
  </div>
);