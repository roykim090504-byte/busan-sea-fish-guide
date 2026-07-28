export type OperationConditionLevel =
  | "very-good"
  | "good"
  | "caution"
  | "difficult"
  | "reconsider";

export type OperationScoreKey = "wind" | "wave" | "current" | "weather" | "freshness";

export type OperationCondition = {
  score: number;
  level: OperationConditionLevel;
  label: string;
  summary: string;
  componentScores: Record<OperationScoreKey, number>;
  reasons: string[];
  warnings: string[];
};
