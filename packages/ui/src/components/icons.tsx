// Icon set for the cocandy.vn clone. UI glyphs come from lucide-react
// (matching the target's thin-line icon style); brand marks are inline SVG.
import {
  Search,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Minus,
  Plus,
  User,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Truck,
  RotateCcw,
  Star,
} from "lucide-react";

export {
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  X as CloseIcon,
  Minus as MinusIcon,
  Plus as PlusIcon,
  User as UserIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  RefreshCw as ExchangeIcon,
  Truck as DeliveryIcon,
  RotateCcw as ReturnIcon,
  Star as StarIcon,
};

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M23 12s0-3.2-.4-4.74a2.5 2.5 0 0 0-1.77-1.77C19.3 5.3 12 5.3 12 5.3s-7.3 0-8.83.4A2.5 2.5 0 0 0 1.4 7.46 26.5 26.5 0 0 0 1 12c0 3.2.4 4.74.4 4.74a2.5 2.5 0 0 0 1.77 1.77c1.53.4 8.83.4 8.83.4s7.3 0 8.83-.4a2.5 2.5 0 0 0 1.77-1.77c.4-1.53.4-4.74.4-4.74ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
    </svg>
  );
}

// TikTok isn't in lucide — inline mark.
export function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.3v12.2a2.5 2.5 0 1 1-2.5-2.5c.23 0 .45.03.66.09v-3.36a5.9 5.9 0 0 0-.66-.04 5.85 5.85 0 1 0 5.85 5.85V9.4a7.55 7.55 0 0 0 4.36 1.39V7.44a4.28 4.28 0 0 1-3.25-1.62Z" />
    </svg>
  );
}

// Zalo floating widget mark.
export function ZaloIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#0068FF" />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="15"
        fill="#fff"
      >
        Zalo
      </text>
    </svg>
  );
}

// Instagram floating widget mark — filled circle with the brand gradient.
export function InstagramColorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#ig-grad)" />
      <g fill="none" stroke="#fff" strokeWidth="2.4">
        <rect x="14" y="14" width="20" height="20" rx="6" />
        <circle cx="24" cy="24" r="5" />
      </g>
      <circle cx="30.5" cy="17.5" r="1.6" fill="#fff" />
    </svg>
  );
}

// Messenger floating widget mark — filled circle with the speech-bubble bolt.
export function MessengerColorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <radialGradient id="msgr-grad" cx="19%" cy="99%" r="109%">
          <stop offset="0%" stopColor="#0099FF" />
          <stop offset="60%" stopColor="#A033FF" />
          <stop offset="90%" stopColor="#FF5280" />
          <stop offset="100%" stopColor="#FF7061" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#msgr-grad)" />
      <path
        fill="#fff"
        d="M24 12c-6.9 0-12 5-12 11.7 0 3.5 1.4 6.6 3.8 8.6.2.2.3.4.3.7l.1 2.3c0 .7.8 1.2 1.4.9l2.6-1.1c.2-.1.4-.1.7 0 1.1.3 2.2.5 3.4.5 6.9 0 12-5 12-11.7S30.9 12 24 12Zm7.2 9-3.5 5.6c-.6.9-1.8 1.1-2.6.5l-2.8-2.1c-.3-.2-.6-.2-.9 0l-3.8 2.9c-.5.4-1.2-.2-.9-.7l3.5-5.6c.6-.9 1.8-1.1 2.6-.5l2.8 2.1c.3.2.6.2.9 0l3.8-2.9c.5-.4 1.2.2.9.7Z"
      />
    </svg>
  );
}
