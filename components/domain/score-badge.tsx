import { Badge } from "@/components/ui/badge";

type ScoreBadgeProps = {
  score: number;
  size?: "sm" | "lg";
};

function scoreToVariant(score: number): "success" | "warning" | "danger" {
  if (score >= 70) return "success";
  if (score >= 40) return "warning";
  return "danger";
}

function scoreToLabel(score: number): string {
  if (score >= 70) return "Buen pagador";
  if (score >= 40) return "Irregular";
  return "Moroso";
}

export function ScoreBadge({ score, size = "sm" }: ScoreBadgeProps) {
  const variant = scoreToVariant(score);
  const label = scoreToLabel(score);

  if (size === "lg") {
    return (
      <div className="inline-flex items-center gap-2">
        <Badge variant={variant} className="text-sm px-3 py-1">
          {score}%
        </Badge>
        <span
          className={`text-sm font-medium ${
            variant === "success"
              ? "text-success"
              : variant === "warning"
                ? "text-warning"
                : "text-danger"
          }`}
        >
          {label}
        </span>
      </div>
    );
  }

  return <Badge variant={variant}>{score}%</Badge>;
}
