export interface RiskBadgeProps {
  level: string;
  className?: string;
}

const levelStyles: Record<string, string> = {
  critical: "text-red-700 bg-red-50 border-red-200",
  high: "text-orange-700 bg-orange-50 border-orange-200",
  medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
  low: "text-green-700 bg-green-50 border-green-200",
};

export function RiskBadge({ level, className = "" }: RiskBadgeProps) {
  const style = levelStyles[level] ?? "text-slate-700 bg-slate-50 border-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-medium capitalize ${style} ${className}`}
    >
      {level} risk
    </span>
  );
}
