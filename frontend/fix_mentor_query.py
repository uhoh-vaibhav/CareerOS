# -*- coding: utf-8 -*-
with open("src/app/dashboard/student/mentor/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove the one I just added
bad_block = """  useEffect(() => {
    // Check for pre-filled query param
    const params = new URLSearchParams(window.location.search);
    const ask = params.get('ask');
    if (ask && !sending && contextLoaded) {
      // Clear URL to avoid re-triggering on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      setInput(ask);
    }
  }, [contextLoaded]);"""

content = content.replace(bad_block, "")

# Add it after contextLoaded
good_block = """  const [contextLoaded, setContextLoaded] = useState(false);

  useEffect(() => {
    // Check for pre-filled query param
    const params = new URLSearchParams(window.location.search);
    const ask = params.get('ask');
    if (ask && contextLoaded) {
      // Clear URL to avoid re-triggering on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      setInput(ask);
    }
  }, [contextLoaded]);"""

content = content.replace("  const [contextLoaded, setContextLoaded] = useState(false);", good_block)

with open("src/app/dashboard/student/mentor/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
