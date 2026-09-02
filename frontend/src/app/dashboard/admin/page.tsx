"use client";
import { useEffect, useState } from "react";
import Sidebar, { ADMIN_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { getAdminStatsRequest, getAdminUsersRequest, changeUserRoleRequest } from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [roleFilter]);

  const loadData = async () => {
    try {
      const statsRes = await getAdminStatsRequest();
      setStats(statsRes);
      
      const usersRes = await getAdminUsersRequest(roleFilter);
      setUsers(usersRes.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await changeUserRoleRequest(userId, newRole);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-ice">
      <Sidebar links={ADMIN_LINKS} />
      <div className="flex-1 flex flex-col">
        <TopNav role="Admin" />
        <main className="p-8 flex-1 overflow-auto">
          <h1 className="text-2xl font-bold text-navy mb-6">Admin Overview</h1>
          
          {loading ? (
            <p className="text-black">Loading...</p>
          ) : (
            <>
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 text-black">
                  <Card title="Total Users" tone="blue">
                    <p className="text-3xl">{stats.totalUsers}</p>
                  </Card>
                  <Card title="Total Resumes" tone="green">
                    <p className="text-3xl">{stats.totalResumes}</p>
                  </Card>
                  <Card title="Total Jobs" tone="gold">
                    <p className="text-3xl">{stats.totalJobPostings}</p>
                  </Card>
                  <Card title="Roles" tone="blue">
                    <div className="text-sm">
                      {Object.entries(stats.byRole).map(([role, count]) => (
                        <div key={role}>{role}: {count as number}</div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              <div className="bg-white p-6 rounded shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-navy">Users</h2>
                  <select 
                    className="border p-2 rounded text-black"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="STUDENT">Student</option>
                    <option value="RECRUITER">Recruiter</option>
                    <option value="PLACEMENT_OFFICER">Placement Officer</option>
                    <option value="FACULTY">Faculty</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-black">Email</th>
                      <th className="py-2 text-black">Joined</th>
                      <th className="py-2 text-black">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b">
                        <td className="py-2 text-black">{u.email}</td>
                        <td className="py-2 text-black">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 text-black">
                          <select 
                            className="border p-1 rounded"
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          >
                            <option value="STUDENT">Student</option>
                            <option value="RECRUITER">Recruiter</option>
                            <option value="PLACEMENT_OFFICER">Placement Officer</option>
                            <option value="FACULTY">Faculty</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </td>
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
