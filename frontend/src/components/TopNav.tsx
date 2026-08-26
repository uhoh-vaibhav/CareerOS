"use client";

import { useRouter } from "next/navigation";

export function TopNav({ role }: { role: string }) {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("careeros_token");
    router.push("/");
  }

  return (
    <header className="bg-navy text-white px-6 py-3 flex items-center justify-between">
      <span className="font-bold tracking-wide">CareerOS</span>
      <nav className="flex items-center gap-6 text-sm">
        <span className="opacity-80">{role}</span>
        <button className="opacity-80 hover:opacity-100">Notifications</button>
        <button
          onClick={handleLogout}
          className="opacity-80 hover:opacity-100"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
