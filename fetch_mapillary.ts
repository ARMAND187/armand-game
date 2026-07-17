import { kurdistanLocations } from "./data/locations";
import fs from "fs";
import path from "path";

const MAPILLARY_TOKEN = "MLY|27954160734202280|be514215d6940ba81f5f40159f8368b2";

async function findNearestImageId(lat: number, lng: number): Promise<string | null> {
  const deltas = [0.01, 0.04, 0.1, 0.25];
  for (const delta of deltas) {
    const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
    try {
      const res = await fetch(
        `https://graph.mapillary.com/images?access_token=${MAPILLARY_TOKEN}&fields=id&bbox=${bbox}&limit=1`
      );
      if (!res.ok) continue;
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        return json.data[0].id;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

async function run() {
  const newLocations = [];
  const promises = kurdistanLocations.map(async (loc) => {
    const id = await findNearestImageId(loc.lat, loc.lng);
    console.log(`Fetched ${loc.name}: ${id}`);
    return { ...loc, imageId: id };
  });

  const results = await Promise.all(promises);
  
  const out = `export interface KurdistanLocation {
  name: string;
  city: string;
  lat: number;
  lng: number;
  imageId?: string;
}

export const kurdistanLocations: KurdistanLocation[] = ${JSON.stringify(results, null, 2)};
`;
  
  fs.writeFileSync(path.join(__dirname, "./data/locations.ts"), out);
  console.log("Done!");
}

run();
