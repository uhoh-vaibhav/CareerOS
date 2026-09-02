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
  { label: "Mock Interview", href: "/dashboard/student/interview" },
  { label: "Portfolio", href: "/dashboard/student/portfolio" },
  { label: "Certificates", href: "/dashboard/student/certificates" },
];

export const ADMIN_LINKS: NavLink[] = [
  { label: "Overview", href: "/dashboard/admin" },
  { label: "Users", href: "/dashboard/admin/users" },
];

export const RECRUITER_LINKS: NavLink[] = [
  { label: "Overview", href: "/dashboard/recruiter" },
  { label: "Job Postings", href: "/dashboard/recruiter/jobs" },
];

export const PLACEMENT_LINKS: NavLink[] = [
  { label: "Overview", href: "/dashboard/placement" },
  { label: "Students", href: "/dashboard/placement/students" },
  { label: "Drives", href: "/dashboard/placement/drives" },
];

export const FACULTY_LINKS: NavLink[] = [
  { label: "Overview", href: "/dashboard/faculty" },
  { label: "Students", href: "/dashboard/faculty/students" },
];

export function Sidebar({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-navy text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-ice"></h2>
      </div>
      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`p-2 rounded ${
                isActive ? "bg-accent" : "hover:bg-accent/50"
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
