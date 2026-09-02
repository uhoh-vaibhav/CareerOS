"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginRequest } from "@/lib/api";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await loginRequest(email, password);
      localStorage.setItem("careeros_token", res.token);
      
      const userRole = res.user.role;
      if (userRole === "STUDENT") router.push("/dashboard/student");
      else if (userRole === "RECRUITER") router.push("/dashboard/recruiter");
      else if (userRole === "PLACEMENT_OFFICER") router.push("/dashboard/placement");
      else if (userRole === "FACULTY") router.push("/dashboard/faculty");
      else if (userRole === "ADMIN") router.push("/dashboard/admin");
      else router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-ice">
      <div className="p-8 bg-white rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-navy">Login</h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="border p-2 rounded text-black"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="border p-2 rounded text-black"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="bg-accent text-white p-2 rounded hover:bg-navy" type="submit">
            Login
          </button>
        </form>
        <p className="mt-4 text-sm text-black">
          Don't have an account? <Link href="/register" className="text-accent underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
