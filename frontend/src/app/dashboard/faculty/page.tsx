"use client";
import React, { useEffect, useState } from "react";
import Sidebar, { FACULTY_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { getFacultyStudentsRequest, getFacultyStudentDetailRequest } from "@/lib/api";

export default function FacultyDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<any>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await getFacultyStudentsRequest();
      setStudents(res.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (profileId: string) => {
    if (expandedStudentId === profileId) {
      setExpandedStudentId(null);
      setStudentDetail(null);
      return;
    }
    setExpandedStudentId(profileId);
    setStudentDetail(null);
    try {
      const res = await getFacultyStudentDetailRequest(profileId);
      setStudentDetail(res.student);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-ice">
      <Sidebar links={FACULTY_LINKS} />
      <div className="flex-1 flex flex-col">
        <TopNav role="Faculty" />
        <main className="p-8 flex-1 overflow-auto">
          <h1 className="text-2xl font-bold text-navy mb-6">Faculty Dashboard</h1>
          
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold text-navy mb-4">My Students</h2>
            {loading ? (
              <p className="text-black">Loading...</p>
            ) : (
              <table className="w-full text-left border-collapse text-black">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Email</th>
                    <th className="py-2">Readiness Score</th>
                    <th className="py-2">Resumes</th>
                    <th className="py-2">Skill Reports</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <React.Fragment key={s.id}>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-2">{s.user?.email || "N/A"}</td>
                        <td className="py-2">{s.readinessScore || 0}</td>
                        <td className="py-2">{s._count?.resumes || 0}</td>
                        <td className="py-2">{s._count?.skillGapReports || 0}</td>
                        <td className="py-2">
                          <button 
                            onClick={() => handleExpand(s.id)}
                            className="text-accent underline text-sm"
                          >
                            {expandedStudentId === s.id ? "Hide Details" : "View Details"}
                          </button>
                        </td>
                      </tr>
                      {expandedStudentId === s.id && (
                        <tr>
                          <td colSpan={5} className="p-0 border-b">
                            <div className="bg-gray-100 p-4">
                              {studentDetail ? (
                                <div className="text-sm space-y-2">
                                  <p><strong>Target Role:</strong> {studentDetail.targetRole || "Not set"}</p>
                                  <p><strong>Bio:</strong> {studentDetail.bio || "No bio"}</p>
                                </div>
                              ) : (
                                <p className="text-sm">Loading details...</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
