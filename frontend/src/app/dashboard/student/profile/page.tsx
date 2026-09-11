"use client";

import { useState, useEffect } from "react";
import { Sidebar, STUDENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { getProfileRequest, updateProfileRequest } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [education, setEducation] = useState("");
  const [targetRole, setTargetRole] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfileRequest()
      .then(res => {
        setName(res.name || "");
        setEmail(res.email || "");
        setEducation(res.education || "");
        setTargetRole(res.targetRole || "");
      })
      .catch(err => setError(err.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    
    try {
      await updateProfileRequest({ name, education, targetRole });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav role="Student" />
      <div className="flex flex-1">
        <Sidebar links={STUDENT_LINKS} />
        <main className="flex-1 p-6 space-y-6 bg-background max-w-3xl">
          <h1 className="text-2xl font-bold text-navy">My Profile</h1>
          <p className="text-sm text-text-muted">
            Manage your personal details and career goals.
          </p>

          {loading ? (
            <p className="text-sm text-text-muted">Loading profile...</p>
          ) : (
            <Card title="Personal Information">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 text-text-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-text-muted mt-1">Email cannot be changed.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education / University</label>
                  <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="e.g. B.S. Computer Science, Stanford University"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Role</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy outline-none"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    This is used by the AI to tailor your mock interviews and roadmap.
                  </p>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-green-600">Profile saved successfully!</p>}

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary text-sm"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
