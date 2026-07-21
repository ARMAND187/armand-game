import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch("http://localhost:3000");
    const html = await res.text();
    console.log("HTML length:", html.length);
    // Find w2grad
    if (html.includes("w2grad")) {
      console.log("w2grad FOUND in HTML!");
    } else {
      console.log("w2grad NOT FOUND in HTML!");
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}
test();
