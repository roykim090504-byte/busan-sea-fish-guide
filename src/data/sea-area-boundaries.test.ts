import { describe, expect, it } from "vitest";
import { SEA_AREAS } from "./sea-areas";
import { SEA_AREA_BOUNDARIES } from "./sea-area-boundaries";

function containsPoint(
  polygon: Array<[number, number]>,
  point: [number, number],
) {
  let inside = false;
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const [currentLat, currentLng] = polygon[current];
    const [previousLat, previousLng] = polygon[previous];
    const [pointLat, pointLng] = point;
    const intersects =
      currentLng > pointLng !== previousLng > pointLng &&
      pointLat <
        ((previousLat - currentLat) * (pointLng - currentLng)) /
          (previousLng - currentLng) +
          currentLat;
    if (intersects) inside = !inside;
  }
  return inside;
}

describe("해역 지도 경계", () => {
  it("모든 부산 해역에 하나씩 경계가 있다", () => {
    expect(SEA_AREA_BOUNDARIES.map((boundary) => boundary.areaId).sort()).toEqual(
      SEA_AREAS.map((area) => area.id).sort(),
    );
  });

  it("각 해역 중심 좌표가 해당 경계 안에 있다", () => {
    for (const area of SEA_AREAS) {
      const boundary = SEA_AREA_BOUNDARIES.find(
        (item) => item.areaId === area.id,
      );
      expect(boundary).toBeDefined();
      expect(
        containsPoint(boundary!.coordinates, [
          area.latitude,
          area.longitude,
        ]),
      ).toBe(true);
    }
  });
});
