import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#09090b] text-zinc-100">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">AI Workspace</h1>
        <p className="text-zinc-400">
          A clean, fast, and secure foundation to chat with multiple AI providers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            to="/login"
            className="px-6 py-2.5 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/10"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-6 py-2.5 rounded-lg font-medium bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
