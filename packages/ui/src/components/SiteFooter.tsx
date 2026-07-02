import { footerColumns, footerContact } from "@repo/ui/lib/navigation";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
  TiktokIcon,
  PhoneIcon,
  MailIcon,
} from "@repo/ui/components/icons";

export function SiteFooter() {
  return (
    <footer className="mt-8">
      {/* Decorative strip */}
      <div className="h-10 w-full bg-[#fffdf4]" />

      <div className="bg-white">
        <div className="cocandy-container grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cocandy/logo.png"
              alt="COCANDY"
              className="mb-3 h-12 w-auto"
            />
            <h3 className="font-display text-[18px] font-bold text-black">
              {footerContact.blurbTitle}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#777]">
              {footerContact.blurb}
            </p>
            <div className="mt-4 flex items-center gap-3">
              {[FacebookIcon, InstagramIcon, YoutubeIcon, TiktokIcon].map(
                (Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b08560] text-white transition-colors hover:bg-[#8a6647]"
                    aria-label="social"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ),
              )}
            </div>
          </div>

          {/* Policy columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="font-display mb-3 text-[16px] font-bold text-black">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[14px] text-[#777] hover:text-[#b08560]">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h4 className="font-display mb-3 text-[16px] font-bold text-black">
              {footerContact.businessName}
            </h4>
            <p className="text-[13px] leading-relaxed text-[#777]">
              {footerContact.office}
            </p>
            <div className="mt-3 flex items-center gap-2 text-[14px] text-black">
              <PhoneIcon className="h-4 w-4 text-[#b08560]" />
              <span>{footerContact.hotline}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[14px] text-black">
              <MailIcon className="h-4 w-4 text-[#b08560]" />
              <span>{footerContact.email}</span>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-[#999]">
              {footerContact.legal}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
