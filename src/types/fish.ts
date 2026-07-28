export type Range = { min: number; max: number };

export type FishCondition = {
  fishId: string;
  fishName: string;
  preferredWaterTemperature: Range & {
    optimalMin: number;
    optimalMax: number;
  };
  preferredWindSpeed: Range;
  preferredWaveHeight: Range;
  preferredCurrentSpeed?: Range;
  preferredMonths: number[];
};
