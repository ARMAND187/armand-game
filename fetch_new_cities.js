const accessToken = 'MLY|27954160734202280|be514215d6940ba81f5f40159f8368b2'; // From earlier conversation

async function getImagesInBbox(minLng, minLat, maxLng, maxLat, limit = 5) {
  const url = `https://graph.mapillary.com/images?access_token=${accessToken}&fields=id,computed_geometry&bbox=${minLng},${minLat},${maxLng},${maxLat}&limit=${limit}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data;
}

async function main() {
  const regions = [
    // Sulaymaniyah
    { name: 'Slemani Salim St', city: 'Sulaymaniyah', bbox: [45.420, 35.550, 45.430, 35.560] },
    { name: 'Slemani Bakhtiari', city: 'Sulaymaniyah', bbox: [45.400, 35.565, 45.415, 35.575] },
    { name: 'Slemani Sarchnar', city: 'Sulaymaniyah', bbox: [45.370, 35.580, 45.385, 35.590] },
    { name: 'Slemani Rizgari', city: 'Sulaymaniyah', bbox: [45.430, 35.570, 45.445, 35.580] },
    { name: 'Slemani Azadi', city: 'Sulaymaniyah', bbox: [45.440, 35.560, 45.450, 35.570] },
    // Kalar
    { name: 'Kalar Center', city: 'Kalar', bbox: [45.300, 34.620, 45.310, 34.630] },
    { name: 'Kalar Market', city: 'Kalar', bbox: [45.315, 34.625, 45.325, 34.635] },
    { name: 'Kalar River', city: 'Kalar', bbox: [45.320, 34.610, 45.330, 34.620] },
    // Halabja
    { name: 'Halabja Center', city: 'Halabja', bbox: [45.980, 35.175, 45.990, 35.185] },
    { name: 'Halabja Monument Area', city: 'Halabja', bbox: [45.970, 35.185, 45.980, 35.195] },
    { name: 'Halabja South', city: 'Halabja', bbox: [45.985, 35.165, 45.995, 35.175] },
    // Koya
    { name: 'Koya Center', city: 'Koya', bbox: [44.620, 36.080, 44.630, 36.090] },
    { name: 'Koya North', city: 'Koya', bbox: [44.630, 36.095, 44.640, 36.105] },
    // Ranya
    { name: 'Ranya Center', city: 'Ranya', bbox: [44.875, 36.250, 44.885, 36.260] },
    { name: 'Ranya East', city: 'Ranya', bbox: [44.890, 36.255, 44.900, 36.265] },
    // Penjwen
    { name: 'Penjwen Center', city: 'Penjwen', bbox: [45.950, 35.615, 45.960, 35.625] },
    { name: 'Penjwen Hills', city: 'Penjwen', bbox: [45.965, 35.610, 45.975, 35.620] },
    // Kifri
    { name: 'Kifri Center', city: 'Kifri', bbox: [44.960, 34.690, 44.970, 34.700] },
    { name: 'Kifri South', city: 'Kifri', bbox: [44.965, 34.680, 44.975, 34.690] }
  ];

  const results = [];
  
  for (const reg of regions) {
    const images = await getImagesInBbox(...reg.bbox);
    if (images && images.length > 0) {
      // Find an image roughly in the middle, or just take the first
      const img = images[0]; 
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
