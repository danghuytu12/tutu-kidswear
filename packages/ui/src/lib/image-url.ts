// Normalize a pasted image URL into one that renders directly in an <img>.
//
// Google Drive "share" links (…/file/d/<ID>/view or ?id=<ID>) are HTML pages,
// not images, so they won't load in <img src>. Convert them to the direct
// content endpoint. Other URLs (including data: URLs and normal image links)
// pass through unchanged.

export function normalizeImageUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return "";

  // Only touch Google Drive links.
  if (/drive\.google\.com/.test(url)) {
    // …/file/d/<ID>/…
    const byPath = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    // …?id=<ID> or …&id=<ID>
    const byQuery = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const id = byPath?.[1] ?? byQuery?.[1];
    if (id) {
      return `https://drive.google.com/uc?export=view&id=${id}`;
    }
  }

  return url;
}
