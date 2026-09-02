"use client";
import { useEffect, useState } from "react";
import Sidebar, { PLACEMENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { getPlacementOverviewRequest, getPlacementStudentsRequest } from "@/lib/api";

export default function PlacementDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const overviewRes = await getPlacementOverviewRequest();
      setOverview(overviewRes);
      
      const studentsRes = await getPlacementStudentsRequest();
      // Sort by score desc
      const sorted = (studentsRes.students || []).sort((a: any, b: any) => 
        (b.readinessScore || 0) - (a.readinessScore || 0)
      );
      setStudents(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-ice">
      <Sidebar links={PLACEMENT_LINKS} />
      <div className="flex-1 flex flex-col">
        <TopNav role="Placement Officer" />
        <main className="p-8 flex-1 overflow-auto">
          <h1 className="text-2xl font-bold text-navy mb-6">Placement Overview</h1>
          
          {loading ? (
            <p className="text-black">Loading...</p>
          ) : (
            <>
              {overview && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 text-black">
                  <Card title="Total Students" tone="blue">
                    <p className="text-3xl">{overview.totalStudents || 0}</p>
                  </Card>
                  <Card title="Avg Readiness" tone="green">
                    <p className="text-3xl">{Math.round(overview.avgReadiness || 0)}</p>
                  </Card>
                  <Card title="With Resume" tone="gold">
                    <p className="text-3xl">{overview.studentsWithResume || 0}</p>
                  </Card>
                  <Card title="Placed" tone="blue">
                    <p className="text-3xl">{overview.studentsPlaced || 0}</p>
                  </Card>
                </div>
              )}

              <div className="bg-white p-6 rounded shadow">
                <h2 className="text-xl font-bold text-navy mb-4">Student Readiness</h2>
                
                <table className="w-full text-left border-collapse text-black">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2">Email</th>
                      <th className="py-2">Target Role</th>
                      <th className="py-2">Readiness Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} className="border-b">
                        <td className="py-2">{s.user?.email || "N/A"}</td>
                        <td className="py-2">{s.targetRole || "Not set"}</td>
                        <td className="py-2 font-bold text-accent">{s.readinessScore || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
