import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to the LMS</h1>
      <div className="flex gap-4">
        <Link href="/auth/login" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors">Login</Link>
        <Link href="/auth/register" className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Register</Link>
      </div>
    </main>
  );
}