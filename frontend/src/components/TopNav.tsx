"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getProfileRequest } from "@/lib/api";
import Link from "next/link";

export function TopNav({ role }: { role: string }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("careeros_token");
    if (token) {
      try {
        const payloadStr = atob(token.split(".")[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadStr);
        // Backend JWT does not contain email, so we just use role-based fallback if profile fetch fails
        setEmail(payload.email || (role === "Student" ? "Student" : "User"));
      } catch (e) {}
    }
    // Only fetch student profile for STUDENT role to avoid 403
    if (role === "Student") {
      getProfileRequest().then(profile => {
        if (profile.name) setName(profile.name);
        if (profile.email) setEmail(profile.email);
      }).catch(() => {});
    }
  }, [role]);

  function handleLogout() {
    localStorage.removeItem("careeros_token");
    router.push("/");
  }
  
  const profileLink = role === "Student" ? "/dashboard/student/profile" : "/dashboard";

  return (
    <header className="bg-surface text-text-main px-6 py-4 flex items-center justify-between border-b border-border shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-xl">
          C
        </div>
        <span className="font-extrabold tracking-tight text-xl text-navy">CareerOS</span>
      </div>
      <nav className="flex items-center gap-6 text-sm font-medium">
        <button className="text-text-muted hover:text-navy transition-colors">Notifications</button>
        <Link 
          href={profileLink} 
          className="flex items-center gap-3 pl-6 border-l border-border hover:opacity-80 transition-opacity cursor-pointer group"
        >
          <div className="flex flex-col text-right">
            {email && <span className="font-semibold text-navy group-hover:text-accent transition-colors">{name || email}</span>}
            <span className="text-xs text-text-muted uppercase tracking-wider font-bold">{role}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-ice border border-border flex items-center justify-center font-bold text-accent group-hover:bg-border transition-colors shadow-sm">
            {name ? name[0].toUpperCase() : (email ? email[0].toUpperCase() : role[0])}
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="ml-2 px-4 py-2 rounded-xl bg-ice text-navy hover:bg-border transition-colors text-xs font-semibold shadow-sm"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
