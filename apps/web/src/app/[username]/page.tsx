'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
          {username[0].toUpperCase()}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          @{username}
        </h1>
        <p className="text-gray-600 mb-8">Ghost Wallet User</p>

        <Link
          href={`/pay/${username}`}
          className="block w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
        >
          Send Payment
        </Link>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Accepts payments from any chain
          </p>
        </div>
      </div>
    </div>
  );
}
