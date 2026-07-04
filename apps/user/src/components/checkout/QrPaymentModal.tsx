"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { useToast } from "@repo/ui/components/ui/toast";
import { formatVnd } from "@repo/ui/lib/cart";
import { MotionButton } from "@repo/ui/components/motion";
import { compressToDataUrl } from "@/lib/image";
import { readAmountsFromImage, matchesAmount } from "@/lib/ocr";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

interface QrPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Order total in VND the customer must transfer. */
  amount: number;
  /** Suggested transfer note (e.g. the customer's phone number). */
  transferNote: string;
  /**
   * Called once the uploaded receipt's amount matches `amount`. Receives the
   * compressed receipt as a data URL. Should place the order; may throw/reject
   * to keep the modal open (the caller surfaces its own error toast).
   */
  onConfirmed: (proofDataUrl: string) => Promise<void>;
}

export function QrPaymentModal({
  open,
  onOpenChange,
  amount,
  transferNote,
  onConfirmed,
}: QrPaymentModalProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [checking, setChecking] = useState(false);

  function reset() {
    setFile(null);
    setPreviewUrl("");
    setChecking(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/") || f.size > MAX_FILE_BYTES) {
      toast.error("Ảnh không hợp lệ", "Vui lòng chọn ảnh (tối đa 8MB).");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function confirm() {
    if (!file) {
      toast.error("Chưa có ảnh", "Vui lòng tải lên ảnh biên lai chuyển khoản.");
      return;
    }
    setChecking(true);
    try {
      // 1. Read the receipt and verify the transferred amount matches the total.
      const amounts = await readAmountsFromImage(file);
      if (!matchesAmount(amounts, amount)) {
        toast.error(
          "Số tiền không khớp",
          "Số tiền trên biên lai không khớp với đơn hàng. Vui lòng kiểm tra lại ảnh.",
        );
        setChecking(false);
        return;
      }
      // 2. Compress and hand the proof to the caller to place the order.
      const proof = await compressToDataUrl(file);
      await onConfirmed(proof);
      // Success path: caller closes the modal; reset local state defensively.
      reset();
    } catch {
      // OCR or order placement failed — keep the modal open so the user retries.
      toast.error(
        "Không thể xác nhận",
        "Đã có lỗi khi kiểm tra biên lai. Vui lòng thử lại.",
      );
      setChecking(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Chuyển khoản qua QR</DialogTitle>

        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/payment/qr-code.png"
            alt="Mã QR chuyển khoản"
            className="h-52 w-52 rounded-lg border border-black/10 object-contain"
          />
          <p className="text-center text-[14px] text-black/70">
            Quét mã QR để chuyển khoản
          </p>
        </div>

        <div className="rounded-lg bg-[#faf6ef] p-4 text-[14px]">
          <div className="flex items-center justify-between">
            <span className="text-black/60">Số tiền cần chuyển</span>
            <span className="font-bold text-[#b08560]">{formatVnd(amount)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-black/60">Nội dung chuyển khoản</span>
            <span className="font-medium text-black">{transferNote}</span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[14px] text-black">
            Ảnh biên lai chuyển khoản *
          </label>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => pickFile(e.target.files?.[0])}
            className="block w-full cursor-pointer text-[14px] file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#b08560] file:px-4 file:py-2 file:text-white hover:file:bg-[#8a6647]"
          />
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Xem trước biên lai"
              className="mt-3 max-h-56 w-full rounded-lg border border-black/10 object-contain"
            />
          ) : null}
        </div>

        <MotionButton
          type="button"
          onClick={confirm}
          disabled={checking}
          className="w-full cursor-pointer rounded-full bg-[#b08560] py-3 text-[16px] font-semibold text-white hover:bg-[#8a6647] disabled:opacity-60"
        >
          {checking ? "Đang kiểm tra..." : "Xác nhận đã chuyển khoản"}
        </MotionButton>
      </DialogContent>
    </Dialog>
  );
}
