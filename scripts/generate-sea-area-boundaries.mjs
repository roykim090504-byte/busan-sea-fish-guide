import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const OUTPUT_PATH = fileURLToPath(
  new URL("../src/data/sea-area-boundaries.ts", import.meta.url),
);

const EAST_COAST_WAY_IDS = [
  22492824, 967497708, 22493293, 1322826292, 1322826293, 301755081,
  629520636, 629472274, 629472273, 22494430, 304789139, 304789138,
  304788342, 304788472, 22494672, 548310751, 301783358, 301783409,
  301783297, 301783369, 301783296, 301783419, 374560182, 301783303,
  305186469, 472263142, 474010093, 305189551, 305189886,
];

const WEST_COAST_WAY_IDS = [
  22494720, 351419998, 299695979, 299690004, 299690028, 305188263,
  305188901, 305189081, 305189293, 112563293, 305189885, 305189886,
  305189551, 474010093, 472263142, 305186469, 301783303, 374560182,
  301783419, 299818761, 300897492, 300897464, 300897476, 300897468,
  304415154, 22785924, 304287351, 304288915, 304287333, 304287342,
  304287346, 198741465, 304287343, 866560811, 866560093, 866560094,
  304287340, 866560092, 1036807726, 157989430, 304581792, 1036807715,
  304585073, 304588051, 304585139, 1322821625, 304585120, 22782340,
  304585097, 44413419, 1322801379, 22784827, 574764661, 415854834,
];

const TAEJONGDAE_WAY_IDS = [
  22494838, 299826746, 299826723, 299826717, 299826749, 299826743,
  299826751, 74859508, 299826742, 1036769093, 1036769097, 575122823,
  1036769096, 1036769092, 299826728, 455997151, 455997152, 455997149,
  299826741,
];

const GADEOK_WAY_IDS = [
  1322801379, 44413419, 304585097, 22782340, 304585120,
];

const ALL_WAY_IDS = [
  ...new Set([
    ...EAST_COAST_WAY_IDS,
    ...WEST_COAST_WAY_IDS,
    ...TAEJONGDAE_WAY_IDS,
    ...GADEOK_WAY_IDS,
  ]),
];

function coordinateKey(coordinate) {
  return `${coordinate[0]},${coordinate[1]}`;
}

function orderWays(ways) {
  const endpointMap = new Map();

  ways.forEach((way, index) => {
    for (const nodeId of [way.nodes[0], way.nodes.at(-1)]) {
      const indexes = endpointMap.get(nodeId) ?? [];
      indexes.push(index);
      endpointMap.set(nodeId, indexes);
    }
  });

  const openEndpoint = [...endpointMap.entries()].find(
    ([, indexes]) => indexes.length === 1,
  );
  const startNodeId = openEndpoint?.[0] ?? ways[0].nodes[0];
  let currentNodeId = startNodeId;
  const used = new Set();
  const coordinates = [];

  while (used.size < ways.length) {
    const wayIndex = (endpointMap.get(currentNodeId) ?? []).find(
      (index) => !used.has(index),
    );
    if (wayIndex === undefined) break;

    const way = ways[wayIndex];
    const isForward = way.nodes[0] === currentNodeId;
    const geometry = isForward
      ? way.geometry
      : [...way.geometry].reverse();

    used.add(wayIndex);
    if (coordinates.length > 0) geometry.shift();
    coordinates.push(
      ...geometry.map(({ lat, lon }) => [lat, lon]),
    );
    currentNodeId = isForward ? way.nodes.at(-1) : way.nodes[0];
  }

  if (used.size !== ways.length) {
    throw new Error(
      `Disconnected coastline: used ${used.size} of ${ways.length} ways`,
    );
  }

  return coordinates;
}

function squaredSegmentDistance(point, start, end) {
  let latitude = start[0];
  let longitude = start[1];
  let latitudeDelta = end[0] - latitude;
  let longitudeDelta = end[1] - longitude;

  if (latitudeDelta !== 0 || longitudeDelta !== 0) {
    const ratio =
      ((point[0] - latitude) * latitudeDelta +
        (point[1] - longitude) * longitudeDelta) /
      (latitudeDelta ** 2 + longitudeDelta ** 2);

    if (ratio > 1) {
      latitude = end[0];
      longitude = end[1];
    } else if (ratio > 0) {
      latitude += latitudeDelta * ratio;
      longitude += longitudeDelta * ratio;
    }
  }

  latitudeDelta = point[0] - latitude;
  longitudeDelta = point[1] - longitude;
  return latitudeDelta ** 2 + longitudeDelta ** 2;
}

function simplify(coordinates, tolerance = 0.00065) {
  if (coordinates.length <= 2) return coordinates;

  let largestDistance = 0;
  let splitIndex = 0;
  for (let index = 1; index < coordinates.length - 1; index += 1) {
    const distance = squaredSegmentDistance(
      coordinates[index],
      coordinates[0],
      coordinates.at(-1),
    );
    if (distance > largestDistance) {
      largestDistance = distance;
      splitIndex = index;
    }
  }

  if (largestDistance <= tolerance ** 2) {
    return [coordinates[0], coordinates.at(-1)];
  }

  const before = simplify(coordinates.slice(0, splitIndex + 1), tolerance);
  const after = simplify(coordinates.slice(splitIndex), tolerance);
  return before.slice(0, -1).concat(after);
}

function nearestIndex(coordinates, target) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  coordinates.forEach((coordinate, index) => {
    const distance =
      (coordinate[0] - target[0]) ** 2 +
      (coordinate[1] - target[1]) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function pathBetween(coordinates, start, end) {
  const startIndex = nearestIndex(coordinates, start);
  const endIndex = nearestIndex(coordinates, end);
  const from = Math.min(startIndex, endIndex);
  const to = Math.max(startIndex, endIndex);
  const path = coordinates.slice(from, to + 1);

  return coordinateKey(path[0]) ===
    coordinateKey(coordinates[startIndex])
    ? path
    : path.reverse();
}

function southernArc(coordinates, start, end) {
  const startIndex = nearestIndex(coordinates, start);
  const endIndex = nearestIndex(coordinates, end);
  const forward =
    startIndex <= endIndex
      ? coordinates.slice(startIndex, endIndex + 1)
      : coordinates
          .slice(startIndex)
          .concat(coordinates.slice(0, endIndex + 1));
  const backward =
    endIndex <= startIndex
      ? coordinates.slice(endIndex, startIndex + 1).reverse()
      : coordinates
          .slice(endIndex)
          .concat(coordinates.slice(0, startIndex + 1))
          .reverse();

  const minimumLatitude = (path) =>
    Math.min(...path.map(([latitude]) => latitude));
  return minimumLatitude(forward) < minimumLatitude(backward)
    ? forward
    : backward;
}

function formatCoordinates(coordinates) {
  return coordinates
    .map(
      ([latitude, longitude]) =>
        `      [${latitude.toFixed(7)}, ${longitude.toFixed(7)}],`,
    )
    .join("\n");
}

const response = await fetch(OVERPASS_URL, {
  method: "POST",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    "user-agent": "busan-sea-fish-guide coastline generator",
  },
  body: `data=${encodeURIComponent(
    `[out:json][timeout:120];way(id:${ALL_WAY_IDS.join(",")});out geom;`,
  )}`,
});

if (!response.ok) {
  throw new Error(`Overpass request failed: ${response.status}`);
}

const { elements } = await response.json();
const waysById = new Map(elements.map((way) => [way.id, way]));
const selectWays = (ids) =>
  ids.map((id) => {
    const way = waysById.get(id);
    if (!way) throw new Error(`Missing OSM coastline way ${id}`);
    return way;
  });

const eastCoast = orderWays(selectWays(EAST_COAST_WAY_IDS));
const westCoast = orderWays(selectWays(WEST_COAST_WAY_IDS));
const gadeokCoast = pathBetween(
  orderWays(selectWays(GADEOK_WAY_IDS)),
  [35.0832642, 128.7825617],
  [35.0871851, 128.8326701],
);
const taejongdaeCoast = southernArc(
  orderWays(selectWays(TAEJONGDAE_WAY_IDS)),
  [35.0972695, 129.0502409],
  [35.0800808, 129.0960733],
);

const shorelines = {
  gadeok: simplify(gadeokCoast),
  dadaepo: simplify(
    pathBetween(westCoast, [35.0612734, 128.9555002], [35.0830361, 128.9973142]),
  ),
  songdo: simplify(
    pathBetween(westCoast, [35.0830361, 128.9973142], [35.104384, 129.0446227]),
  ),
  taejongdae: simplify(taejongdaeCoast),
  oryukdo: simplify(
    pathBetween(westCoast, [35.104384, 129.0446227], [35.1249809, 129.1128067]),
  ),
  gwangalli: simplify(
    pathBetween(eastCoast, [35.1249938, 129.1127687], [35.1576124, 129.1401748]),
  ),
  haeundae: simplify(
    pathBetween(eastCoast, [35.1576124, 129.1401748], [35.1816101, 129.206753]),
  ),
  songjeong: simplify(
    pathBetween(eastCoast, [35.1816101, 129.206753], [35.2204791, 129.2308267]),
  ),
  gijang: simplify(
    pathBetween(eastCoast, [35.2204791, 129.2308267], [35.3307804, 129.3067829]),
    0.0008,
  ),
};

const outerBoundaries = {
  gadeok: [
    [35.08, 128.91],
    [34.94, 128.91],
    [34.93, 128.73],
  ],
  dadaepo: [
    [34.96, 129.0],
    [34.94, 128.91],
    [35.08, 128.91],
  ],
  songdo: [
    [34.98, 129.05],
    [34.96, 129.0],
  ],
  taejongdae: [
    [35.01, 129.12],
    [34.98, 129.05],
  ],
  oryukdo: [
    [35.1, 129.18],
    [35.01, 129.12],
    [34.98, 129.05],
  ],
  gwangalli: [
    [35.14, 129.19],
    [35.1, 129.18],
  ],
  haeundae: [
    [35.16, 129.23],
    [35.14, 129.19],
  ],
  songjeong: [
    [35.2, 129.28],
    [35.16, 129.23],
  ],
  gijang: [
    [35.33, 129.38],
    [35.2, 129.28],
  ],
};

const areaIds = [
  "gadeok",
  "dadaepo",
  "songdo",
  "taejongdae",
  "oryukdo",
  "gwangalli",
  "haeundae",
  "songjeong",
  "gijang",
];

const output = `export type SeaAreaBoundary = {
  areaId: string;
  coordinates: Array<[latitude: number, longitude: number]>;
};

// OpenStreetMap natural=coastline 좌표를 약 60~80m 허용 오차로 단순화한
// 조업 참고 해역입니다. 법정 행정·조업·어업권 경계로 사용할 수 없습니다.
// Source: https://www.openstreetmap.org/copyright
export const SEA_AREA_BOUNDARIES: SeaAreaBoundary[] = [
${areaIds
  .map(
    (areaId) => `  {
    areaId: "${areaId}",
    coordinates: [
${formatCoordinates(shorelines[areaId].concat(outerBoundaries[areaId]))}
    ],
  },`,
  )
  .join("\n")}
];
`;

await writeFile(OUTPUT_PATH, output, "utf8");
console.log(`Generated ${OUTPUT_PATH}`);
