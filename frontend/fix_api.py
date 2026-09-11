with open("src/lib/api.ts", "r", encoding="utf-8") as f:
    content = f.read()

new_api = """export async function getReadinessHistoryRequest(): Promise<ReadinessScoreResult[]> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/v1/student/readiness/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Request failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.history || [];
}
"""

if "getReadinessHistoryRequest" not in content:
    content += "\n" + new_api
    with open("src/lib/api.ts", "w", encoding="utf-8") as f:
        f.write(content)
