import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6">
      <h1 className="text-5xl font-bold text-navy">CareerOS</h1>
      <p className="text-gray-600 max-w-md">
        An AI-powered career intelligence platform — resume analysis, skill-gap
        roadmaps, an AI mentor, and mock interviews in one place.
      </p>
      <div className="flex gap-4">
        <Link href="/login" className="px-5 py-2 rounded-lg bg-navy text-white font-medium hover:opacity-90">
          Log in
        </Link>
        <Link href="/register" className="px-5 py-2 rounded-lg border border-navy text-navy font-medium hover:bg-ice">
          Create account
        </Link>
      </div>
    </main>
  );
}
