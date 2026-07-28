export const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");
