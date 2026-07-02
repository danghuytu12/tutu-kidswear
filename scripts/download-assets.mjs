// Downloads cocandy.vn assets to public/images/cocandy and public/seo.
// Usage: node scripts/download-assets.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const ROOT = new URL("../public/", import.meta.url);

// [remoteUrl, localPath] pairs. Local paths are relative to public/.
const ASSETS = [
  // Brand
  ["https://content.pancake.vn/1/s500x500/fwebp90/1b/6c/c1/80/a358025fe651603752113df7b3008895f9f9d62b92c46d39a3cfdf4f-w:500-h:500-l:138920-t:image/png.png", "images/cocandy/logo.png"],
  ["https://content.pancake.vn/1/s900x900/fwebp/c3/1b/74/d7/3941b8a77f96712494c28a2e1b099f2213e337295dce53920388fc57.png", "seo/favicon.png"],
  // Hero slides
  ["https://content.pancake.vn/web-media-262/s2640x1320/fwebp90/29/d7/4c/b4/dc716683e1b5cb9bda34a2fc89db20f692dac0fbca79214b2eb3f810-w:8334-h:4167-l:3976686-t:image/png.png", "images/cocandy/hero-1.png"],
  ["https://content.pancake.vn/web-media-262/s2000x1000/fwebp90/f1/13/71/1a/9174ff185c57b0eab52a756f8f1e795532eea28794a3bab405ad46c2-w:2000-h:1000-l:1555697-t:image/png.png", "images/cocandy/hero-2.png"],
  ["https://content.pancake.vn/web-media-262/s1000x500/fwebp90/8f/b6/0c/4f/7c62790e1dd96de5aab90484979939c3a7cbd75ed9d8bcb1340be639-w:1000-h:500-l:1134277-t:image/png.png", "images/cocandy/hero-3.png"],
  ["https://content.pancake.vn/web-media-262/s2000x1000/fwebp90/74/c9/fb/66/06d1e0095b120ccb30d07c4588a044d4f3174f71a481c26d75d68860-w:2000-h:1000-l:3385518-t:image/png.png", "images/cocandy/hero-4.png"],
  ["https://content.pancake.vn/1/s2000x1000/fwebp90/13/57/61/a8/62ae9399e2075b7b5c9efe603af606a2b7730ad3c3aae67b8fc99ed4-w:2000-h:1000-l:971025-t:image/png.png", "images/cocandy/hero-5.png"],
  // Mid banners
  ["https://content.pancake.vn/web-media-262/s2000x1000/fwebp90/01/b3/60/84/746ed74a40d4a5dbdfb0694264d7db023e1798132a085647d5a9792f-w:2000-h:1000-l:2953823-t:image/png.png", "images/cocandy/banner-1.png"],
  ["https://content.pancake.vn/web-media-262/s2000x1000/fwebp90/0d/2b/14/b8/99a6a7cdf4d11f85dd9692bc44ee2ca7b7ed167dae1096e545543bfd-w:2000-h:1000-l:1054002-t:image/png.png", "images/cocandy/banner-2.png"],
  ["https://content.pancake.vn/web-media-262/s2000x1000/fwebp90/e2/da/59/09/7aa3dd167fa2240010ae31afacf03e15d0d8936480faa9e9a7c6e462-w:2000-h:1000-l:2049247-t:image/png.png", "images/cocandy/banner-3.png"],
  // PDP gallery (raclan brown tee)
  ["https://content.pancake.vn/web-media-262/s1280x1280/fwebp90/a8/2e/40/2d/c6985bd13c2abd19969ab5fcba3611fe4c1a847d8fe0812bd07cd955-w:1280-h:1280-l:178611-t:image/jpeg.jpeg", "images/cocandy/pdp-0.jpg"],
  ["https://content.pancake.vn/web-media-262/s1920x1920/fwebp90/4d/4c/36/e1/b5ee658081ab7771e65f5c56e9e17301290b1ad51d904ef934395f03-w:1920-h:1920-l:378859-t:image/jpeg.jpeg", "images/cocandy/pdp-1.jpg"],
  ["https://content.pancake.vn/web-media-262/s1920x1920/fwebp90/e7/25/8b/4f/fb7fa4153de17c1edd0cbedac3cf767d9d8564cd1cae4b08bd613294-w:1920-h:1920-l:396237-t:image/jpeg.jpeg", "images/cocandy/pdp-2.jpg"],
  ["https://content.pancake.vn/web-media-262/s1920x1920/fwebp90/ca/3b/59/53/58e5a7bebd10283201a01a9cbbb49100af1944e9c0881c9857ac1ce9-w:1920-h:1920-l:1027562-t:image/jpeg.jpeg", "images/cocandy/pdp-3.jpg"],
  ["https://content.pancake.vn/web-media-262/s1920x1920/fwebp90/44/db/d1/31/b3fd927557fbd9927fae1e1d93da4b69fe660ae42d60a687c89acb26-w:1920-h:1920-l:838103-t:image/jpeg.jpeg", "images/cocandy/pdp-4.jpg"],
  ["https://content.pancake.vn/web-media-262/s1920x1920/fwebp90/e2/04/5a/d0/a0489dc1d12101f023ba560394735c02fd7a3187bd01d43b7712fa1e-w:1920-h:1920-l:981096-t:image/jpeg.jpeg", "images/cocandy/pdp-5.jpg"],
  ["https://content.pancake.vn/web-media-262/s1920x1920/fwebp90/7e/eb/40/a5/f9d67a0f3bcd8bddaf1ae755143275225cd070bde2f2f6721baa406a-w:1920-h:1920-l:385526-t:image/jpeg.jpeg", "images/cocandy/pdp-6.jpg"],
];

async function download([url, local]) {
  const dest = new URL(local, ROOT);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await mkdir(dirname(dest.pathname), { recursive: true });
    await writeFile(dest, buf);
    console.log(`✓ ${local} (${(buf.length / 1024).toFixed(0)} KB)`);
    return true;
  } catch (err) {
    console.error(`✗ ${local}: ${err.message}`);
    return false;
  }
}

async function main() {
  let ok = 0;
  // batches of 4
  for (let i = 0; i < ASSETS.length; i += 4) {
    const batch = ASSETS.slice(i, i + 4);
    const results = await Promise.all(batch.map((a) => download(a)));
    ok += results.filter(Boolean).length;
  }
  console.log(`\nDone: ${ok}/${ASSETS.length} assets downloaded.`);
}

main();
