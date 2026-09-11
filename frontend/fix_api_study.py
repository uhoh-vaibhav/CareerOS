with open("src/lib/api.ts", "r", encoding="utf-8") as f:
    content = f.read()

new_api = """
export async function generateStudyMaterialRequest(roadmapId: string, phaseIdx: number, subtaskIdx: number, forceRegenerate: boolean = false): Promise<any> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/v1/student/roadmap/${roadmapId}/material`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ phaseIdx, subtaskIdx, forceRegenerate }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to generate study material");
  }

  const data = await res.json();
  return data.material;
}
"""

if "generateStudyMaterialRequest" not in content:
    content += new_api
    with open("src/lib/api.ts", "w", encoding="utf-8") as f:
        f.write(content)
