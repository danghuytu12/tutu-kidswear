"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";

/**
 * Renders the bank-transfer receipt for a QR order: a thumbnail that opens the
 * full image in a dialog. COD orders (or QR orders missing a receipt) show "—".
 */
export function PaymentProofCell({ proof }: { proof?: string }) {
  if (!proof) {
    return <span className="text-sm text-[#98A2B3]">—</span>;
  }
  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={proof}
          alt="Biên lai chuyển khoản"
          className="h-12 w-12 rounded-md border border-[#E4E7EC] object-cover transition hover:opacity-80"
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle>Biên lai chuyển khoản</DialogTitle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={proof}
          alt="Biên lai chuyển khoản"
          className="w-full rounded-lg border border-[#E4E7EC] object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
