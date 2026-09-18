"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProfileRequest, logoutRequest, getMeRequest } from "@/lib/api";

interface TopNavProps {
  role: string;
}

export function TopNav({ role }: TopNavProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    // 1) Fetch current user details via the cookie-authenticated /me endpoint
    getMeRequest()
      .then(data => {
        if (data.user.email) setEmail(data.user.email);
        if (data.user.name) setName(data.user.name);
      })
      .catch(() => {
        // If not authenticated, we could redirect to login here,
        // but for now just let the role logic handle fallbacks
        setEmail(role === "Student" ? "Student" : "User");
      });

    // 2) If student, fetch profile which might have more recent name
    if (role === "Student") {
      getProfileRequest().then(profile => {
        if (profile.name) setName(profile.name);
        if (profile.email) setEmail(profile.email);
      }).catch(() => {});
    }
  }, [role]);

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch (e) {}
    localStorage.removeItem("careeros_token"); // Cleanup legacy
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
