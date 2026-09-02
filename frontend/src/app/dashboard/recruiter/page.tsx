"use client";
import { useEffect, useState } from "react";
import Sidebar, { RECRUITER_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { createJobPostingRequest, getRecruiterJobsRequest, getJobApplicationsRequest, updateJobStatusRequest } from "@/lib/api";

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await getRecruiterJobsRequest();
      setJobs(res.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);
      await createJobPostingRequest(title, skillsArray);
      setTitle("");
      setSkills("");
      loadJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await updateJobStatusRequest(jobId, newStatus);
      loadJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExpandJob = async (jobId: string) => {
    if (expandedJob === jobId) {
      setExpandedJob(null);
      return;
    }
    setExpandedJob(jobId);
    try {
      const res = await getJobApplicationsRequest(jobId);
      setApplications(res.applications || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-ice">
      <Sidebar links={RECRUITER_LINKS} />
      <div className="flex-1 flex flex-col">
        <TopNav role="Recruiter" />
        <main className="p-8 flex-1 overflow-auto">
          <h1 className="text-2xl font-bold text-navy mb-6">Recruiter Dashboard</h1>
          
          <div className="bg-white p-6 rounded shadow mb-8">
            <h2 className="text-xl font-bold text-navy mb-4">Create Job Posting</h2>
            <form onSubmit={handleCreateJob} className="flex flex-col gap-4">
              <input
                className="border p-2 rounded text-black"
                placeholder="Job Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <input
                className="border p-2 rounded text-black"
                placeholder="Required Skills (comma separated)"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                required
              />
              <button type="submit" className="bg-accent text-white p-2 rounded w-32 hover:bg-navy">
                Create Job
              </button>
            </form>
          </div>

          <h2 className="text-xl font-bold text-navy mb-4">My Job Postings</h2>
          {loading ? (
            <p className="text-black">Loading...</p>
          ) : (
            <div className="flex flex-col gap-4 text-black">
              {jobs.map(job => (
                <div key={job.id} className="bg-white p-6 rounded shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold">{job.title}</h3>
                      <div className="flex gap-2 mt-2">
                        {job.requiredSkills?.map((skill: string) => (
                          <span key={skill} className="bg-gray-200 px-2 py-1 rounded text-xs">{skill}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded text-xs text-white ${job.status === "OPEN" ? "bg-green-500" : "bg-red-500"}`}>
                        {job.status}
                      </span>
                      <button 
                        onClick={() => handleToggleStatus(job.id, job.status)}
                        className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 text-black"
                      >
                        Toggle Status
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 border-t pt-4">
                    <button 
                      onClick={() => handleExpandJob(job.id)}
                      className="text-accent underline text-sm"
                    >
                      {expandedJob === job.id ? "Hide Applications" : "View Applications"}
                    </button>
                    {expandedJob === job.id && (
                      <div className="mt-4 bg-gray-50 p-4 rounded text-black">
                        {applications.length === 0 ? (
                          <p className="text-sm">No applications yet.</p>
                        ) : (
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="py-2">Student</th>
                                <th className="py-2">Resume Score</th>
                                <th className="py-2">Applied At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {applications.map(app => (
                                <tr key={app.id} className="border-b">
                                  <td className="py-2">{app.studentProfile?.user?.email || "Unknown"}</td>
                                  <td className="py-2">{app.studentProfile?.readinessScore || "N/A"}</td>
                                  <td className="py-2">{new Date(app.createdAt).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
