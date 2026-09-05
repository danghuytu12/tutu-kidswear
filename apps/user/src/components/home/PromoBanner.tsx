import Link from "next/link";

interface PromoBannerProps {
  src: string;
  href: string;
  alt?: string;
}

export function PromoBanner({ src, href, alt = "" }: PromoBannerProps) {
  return (
    <section className="cocandy-container py-4">
      <Link href={href} className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full rounded-lg object-cover" />
      </Link>
    </section>
  );
}
