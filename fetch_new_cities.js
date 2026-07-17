const accessToken = 'MLY|9053331168128362|20fcb53b8f2cce695a432cb390dc3657'; // From earlier conversation

async function getImagesInBbox(minLng, minLat, maxLng, maxLat, limit = 5) {
  const url = `https://graph.mapillary.com/images?access_token=${accessToken}&fields=id,computed_geometry&bbox=${minLng},${minLat},${maxLng},${maxLat}&limit=${limit}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data;
}

async function main() {
  const regions = [
    { name: 'Kirkuk Citadel', city: 'Kirkuk', bbox: [44.38, 35.45, 44.42, 35.48] },
    { name: 'Kirkuk Center', city: 'Kirkuk', bbox: [44.37, 35.46, 44.40, 35.49] },
    { name: 'Koya Center', city: 'Koya', bbox: [44.60, 36.07, 44.65, 36.10] },
    { name: 'Ranya Center', city: 'Ranya', bbox: [44.85, 36.24, 44.90, 36.27] },
    { name: 'Halabja Center', city: 'Halabja', bbox: [45.96, 35.16, 46.00, 35.19] },
    { name: 'Zaxo Center', city: 'Zakho', bbox: [42.66, 37.13, 42.70, 37.15] },
    { name: 'Soran Center', city: 'Soran', bbox: [44.52, 36.64, 44.56, 36.67] },
    { name: 'Choman Center', city: 'Choman', bbox: [44.87, 36.62, 44.91, 36.65] },
    { name: 'Kalar Center', city: 'Kalar', bbox: [45.29, 34.61, 45.33, 34.64] },
    { name: 'Darbandikhan Center', city: 'Darbandikhan', bbox: [45.67, 35.10, 45.71, 35.13] },
    { name: 'Erbil Ankawa', city: 'Erbil', bbox: [43.98, 36.21, 44.02, 36.24] },
    { name: 'Erbil Bakhtiari', city: 'Erbil', bbox: [44.01, 36.18, 44.05, 36.21] },
    { name: 'Slemani Salim Street', city: 'Sulaymaniyah', bbox: [45.42, 35.55, 45.45, 35.57] },
    { name: 'Slemani Bakhtiari', city: 'Sulaymaniyah', bbox: [45.40, 35.56, 45.43, 35.58] },
    { name: 'Duhok Mazi', city: 'Duhok', bbox: [42.98, 36.85, 43.01, 36.87] },
  ];

  const results = [];
  
  for (const reg of regions) {
    const images = await getImagesInBbox(...reg.bbox);
    if (images && images.length > 0) {
      const img = images[0]; // Just take first one for now, or maybe random?
      const coords = img.computed_geometry.coordinates;
      results.push({
        name: reg.name,
        city: reg.city,
        lat: coords[1],
        lng: coords[0],
        imageId: img.id
      });
    } else {
      console.log(`No images found for ${reg.name}`);
    }
  }
  
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
