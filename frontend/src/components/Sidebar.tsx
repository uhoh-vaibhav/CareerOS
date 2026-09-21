"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavLink {
  label: string;
  href: string;
}

export const STUDENT_LINKS: NavLink[] = [
  { label: "Overview", href: "/dashboard/student" },
  { label: "Resume", href: "/dashboard/student/resume" },
  { label: "Skill Gap", href: "/dashboard/student/skill-gap" },
  { label: "Roadmap", href: "/dashboard/student/roadmap" },
  { label: "AI Mentor", href: "/dashboard/student/mentor" },
  { label: "Mock Interview", href: "/dashboard/student/mock-interview" },
  { label: "Portfolio", href: "/dashboard/student/portfolio" },
  { label: "Certificates", href: "/dashboard/student/certificates" },
  { label: "Profile", href: "/dashboard/student/profile" },
];

export const ADMIN_LINKS: NavLink[] = [
  { label: "Dashboard", href: "/dashboard/admin" },
];

export const RECRUITER_LINKS: NavLink[] = [
  { label: "Dashboard", href: "/dashboard/recruiter" },
];

export const PLACEMENT_LINKS: NavLink[] = [
  { label: "Dashboard", href: "/dashboard/placement" },
];

export const FACULTY_LINKS: NavLink[] = [
  { label: "Dashboard", href: "/dashboard/faculty" },
];

export function Sidebar({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-surface border-r border-border min-h-[calc(100vh-73px)] p-4 flex flex-col">
      <nav className="flex flex-col gap-1.5 mt-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? "bg-accent/10 text-accent" 
                  : "text-text-muted hover:bg-ice hover:text-navy"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
