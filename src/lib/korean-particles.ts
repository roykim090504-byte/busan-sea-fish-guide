const HANGUL_FIRST = 0xac00;
const HANGUL_LAST = 0xd7a3;
const JONGSEONG_COUNT = 28;

export function withTopicParticle(value: string) {
  const trimmed = value.trimEnd();
  const lastCharacter = trimmed.at(-1);
  if (!lastCharacter) return value;

  const characterCode = lastCharacter.charCodeAt(0);
  const hasFinalConsonant =
    characterCode >= HANGUL_FIRST &&
    characterCode <= HANGUL_LAST &&
    (characterCode - HANGUL_FIRST) % JONGSEONG_COUNT !== 0;

  return `${value}${hasFinalConsonant ? "은" : "는"}`;
}
