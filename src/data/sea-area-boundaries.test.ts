import { describe, expect, it } from "vitest";
import polygonClipping from "polygon-clipping";
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

function containsBoundaryPoint(
  polygons: Array<Array<Array<[number, number]>>>,
  point: [number, number],
) {
  return polygons.some(
    ([outerRing, ...holes]) =>
      containsPoint(outerRing, point) &&
      holes.every((hole) => !containsPoint(hole, point)),
  );
}

function toClippingPolygon(
  polygons: Array<Array<Array<[number, number]>>>,
): Array<Array<Array<[number, number]>>> {
  return polygons.map((polygon) =>
    polygon.map((ring) =>
      ring.map(
        ([latitude, longitude]) =>
          [longitude, latitude] as [number, number],
      ),
    ),
  );
}

function ringArea(ring: Array<[number, number]>) {
  return Math.abs(
    ring.reduce((sum, [x, y], index) => {
      const [nextX, nextY] = ring[(index + 1) % ring.length];
      return sum + x * nextY - nextX * y;
    }, 0) / 2,
  );
}

function multiPolygonArea(
  polygons: Array<Array<Array<[number, number]>>>,
) {
  return polygons.reduce(
    (total, [outerRing, ...holes]) =>
      total +
      ringArea(outerRing) -
      holes.reduce((holeTotal, hole) => holeTotal + ringArea(hole), 0),
    0,
  );
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
        containsBoundaryPoint(boundary!.polygons, [
          area.latitude,
          area.longitude,
        ]),
        `${area.id} 중심 좌표가 경계 밖에 있습니다.`,
      ).toBe(true);
    }
  });

  it("서로 다른 해역 사이에 교차 면적이 없다", () => {
    for (let first = 0; first < SEA_AREA_BOUNDARIES.length; first += 1) {
      for (
        let second = first + 1;
        second < SEA_AREA_BOUNDARIES.length;
        second += 1
      ) {
        const overlap = polygonClipping.intersection(
          toClippingPolygon(SEA_AREA_BOUNDARIES[first].polygons),
          toClippingPolygon(SEA_AREA_BOUNDARIES[second].polygons),
        );
        expect(
          multiPolygonArea(overlap),
          `${SEA_AREA_BOUNDARIES[first].areaId}와 ${SEA_AREA_BOUNDARIES[second].areaId}가 겹칩니다.`,
        ).toBeLessThan(1e-12);
      }
    }
  });

  it("송도·영도·오륙도는 조각이나 내부 고리 없이 각각 하나의 영역이다", () => {
    for (const areaId of ["songdo", "taejongdae", "oryukdo"]) {
      const boundary = SEA_AREA_BOUNDARIES.find(
        (item) => item.areaId === areaId,
      );
      expect(boundary?.polygons, `${areaId} 영역이 여러 조각입니다.`).toHaveLength(1);
      expect(
        boundary?.polygons[0],
        `${areaId} 영역에 겹쳐 보일 수 있는 내부 고리가 있습니다.`,
      ).toHaveLength(1);
    }
  });
});
