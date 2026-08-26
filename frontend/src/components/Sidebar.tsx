import Link from "next/link";

const STUDENT_LINKS: { label: string; href: string }[] = [
  { label: "Overview", href: "/dashboard/student" },
  { label: "Resume", href: "/dashboard/student/resume" },
  { label: "Skill Gap", href: "/dashboard/student/skill-gap" },
  { label: "Roadmap", href: "/dashboard/student/roadmap" },
  { label: "AI Mentor", href: "/dashboard/student/mentor" },
  { label: "Mock Interview", href: "/dashboard/student/interview" },
  { label: "Portfolio", href: "/dashboard/student/portfolio" },
  { label: "Certificates", href: "/dashboard/student/certificates" },
];

export function Sidebar({ links = STUDENT_LINKS }: { links?: typeof STUDENT_LINKS }) {
  return (
    <aside className="w-48 bg-ice p-4">
      <ul className="space-y-3 text-sm text-navy font-medium">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-accent">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
