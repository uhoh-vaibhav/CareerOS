"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerRequest } from "@/lib/api";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await registerRequest(name, email, password, role);
      localStorage.setItem("careeros_token", res.token);
      
      const userRole = res.user.role;
      if (userRole === "STUDENT") router.push("/dashboard/student");
      else if (userRole === "RECRUITER") router.push("/dashboard/recruiter");
      else if (userRole === "PLACEMENT_OFFICER") router.push("/dashboard/placement");
      else if (userRole === "FACULTY") router.push("/dashboard/faculty");
      else if (userRole === "ADMIN") router.push("/dashboard/admin");
      else router.push("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="p-8 bg-surface border border-border rounded-xl shadow-card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-text-main">Create your account</h1>
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="input-field text-text-main"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="input-field text-text-main"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input-field text-text-main"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <select 
            className="input-field text-text-main cursor-pointer"
            value={role} 
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="STUDENT">Student</option>
            <option value="RECRUITER">Recruiter</option>
            <option value="PLACEMENT_OFFICER">Placement Officer</option>
            <option value="FACULTY">Faculty</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button className="btn-primary mt-2" type="submit">
            Register
          </button>
        </form>
        <p className="mt-6 text-sm text-text-muted text-center">
          Already have an account? <Link href="/login" className="text-accent font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
