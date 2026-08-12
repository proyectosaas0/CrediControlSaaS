import { Badge } from "@/components/ui/badge";

type ScoreBadgeProps = {
  score: number;
  size?: "sm" | "lg";
  hasHistory?: boolean;
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

export function ScoreBadge({ score, size = "sm", hasHistory = true }: ScoreBadgeProps) {
  const variant = hasHistory ? scoreToVariant(score) : "muted";
  const label = hasHistory ? scoreToLabel(score) : "Sin historial";

  if (size === "lg") {
    return (
      <div className="inline-flex items-center gap-2">
        <Badge variant={variant} className="text-sm px-3 py-1">
          {hasHistory ? `${score}%` : "—"}
        </Badge>
        <span
          className={`text-sm font-medium ${
            variant === "success"
              ? "text-success"
              : variant === "warning"
                ? "text-warning"
                : variant === "danger"
                  ? "text-danger"
                  : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
      </div>
    );
  }

  return <Badge variant={variant}>{hasHistory ? `${score}%` : label}</Badge>;
}
