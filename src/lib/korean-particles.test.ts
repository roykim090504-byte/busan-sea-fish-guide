import { describe, expect, it } from "vitest";
import { withTopicParticle } from "./korean-particles";

describe("한국어 보조사", () => {
  it("받침이 있는 지역명에는 '은'을 붙인다", () => {
    expect(withTopicParticle("가덕도 인근")).toBe("가덕도 인근은");
  });

  it("받침이 없는 지역명에는 '는'을 붙인다", () => {
    expect(withTopicParticle("다대포 앞바다")).toBe("다대포 앞바다는");
  });
});
