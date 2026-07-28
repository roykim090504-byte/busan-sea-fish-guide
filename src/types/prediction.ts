export type SuitabilityLevel =
  | "very-high"
  | "high"
  | "medium"
  | "low"
  | "very-low";

export type Confidence = "low" | "medium" | "high";
export type ScoreKey = "temperature" | "season" | "wind" | "wave" | "current";

export type FishPrediction = {
  fishId: string;
  fishName: string;
  suitabilityScore: number;
  level: SuitabilityLevel;
  confidence: Confidence;
  reasons: string[];
  warnings: string[];
  componentScores: Partial<Record<ScoreKey, number>>;
  missingData: string[];
};
