with open("src/app/dashboard/student/roadmap/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_toggle = """  async function toggleStep(idx: number) {
    let newPct = 0;
    let nextArr: number[] = [];
    
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      
      newPct = milestones.length > 0 ? Math.round((next.size / milestones.length) * 100) : 0;
      nextArr = Array.from(next);
      return next;
    });

    if (roadmap) {
      setSaving(true);
      try {
        // Pass both newPct and the exact array of completed steps
        await updateRoadmapProgressRequest(roadmap.id, newPct, nextArr);
        setRoadmap({ ...roadmap, progressPct: newPct });
      } catch {
        // Revert on failure
        setCompletedSteps(prev => {
          const reverted = new Set(prev);
          if (reverted.has(idx)) reverted.delete(idx);
          else reverted.add(idx);
          return reverted;
        });
      } finally {
        setSaving(false);
      }
    }
  }"""

new_toggle = """  async function toggleStep(idx: number) {
    // Compute the next state using the current closure value
    const nextSteps = new Set(completedSteps);
    if (nextSteps.has(idx)) nextSteps.delete(idx);
    else nextSteps.add(idx);
    
    const nextArr = Array.from(nextSteps);
    const newPct = milestones.length > 0 ? Math.round((nextArr.length / milestones.length) * 100) : 0;
    
    // Optimistically update the UI
    setCompletedSteps(nextSteps);

    if (roadmap) {
      setSaving(true);
      try {
        await updateRoadmapProgressRequest(roadmap.id, newPct, nextArr);
        setRoadmap(prev => prev ? { ...prev, progressPct: newPct } : prev);
      } catch (err) {
        console.error("Failed to save progress", err);
        // Revert on failure
        setCompletedSteps(prev => {
          const reverted = new Set(prev);
          if (reverted.has(idx)) reverted.delete(idx);
          else reverted.add(idx);
          return reverted;
        });
      } finally {
        setSaving(false);
      }
    }
  }"""

if old_toggle in content:
    content = content.replace(old_toggle, new_toggle)
    with open("src/app/dashboard/student/roadmap/page.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Toggle updated successfully.")
else:
    print("Error: Could not find old_toggle in page.tsx")
