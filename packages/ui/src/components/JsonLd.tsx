// Renders a JSON-LD structured-data block. Server-safe; the data is our own
// (never user input), so dangerouslySetInnerHTML is appropriate here.

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
