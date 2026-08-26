export function Card({
  title,
  children,
  tone = "blue",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "blue" | "green" | "gold";
}) {
  const toneClasses: Record<string, string> = {
    blue: "bg-ice border-navy/20",
    green: "bg-green-50 border-green-700/20",
    gold: "bg-amber-50 border-amber-600/20",
  };

  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <h3 className="font-semibold text-navy mb-1">{title}</h3>
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  );
}
