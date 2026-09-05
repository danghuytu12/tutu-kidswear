"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";
import {
  formatDayKey,
  parseShopeeFilename,
  type FilenameRange,
} from "@repo/ui/lib/shopee/filename";
import { formatVnd } from "@repo/ui/lib/cart";

interface ImportResult {
  rowCount: number;
  orderCount: number;
  replacedRowCount: number;
  totalRevenue: number;
  outOfRangeCount: number;
  skippedNoCode: number;
  unparsedDateCount: number;
}

/**
 * Uploads a Shopee export and reports what the import did.
 *
 * The filename's date range is decoded in the browser and shown for
 * confirmation before anything is sent. That step matters: the filename has no
 * year, so the range is partly inferred, and this is where a wrong inference
 * gets caught — by which point the import would already have replaced data.
 */
export function ShopeeUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{
    file: File;
    range: FilenameRange;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Let the same file be picked again after a failed attempt.
    e.target.value = "";
    if (!file) return;

    setError("");
    setResult(null);

    const parsed = parseShopeeFilename(file.name, new Date());
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setPending({ file, range: parsed.range });
  }

  async function onConfirm() {
    if (!pending || busy) return;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", pending.file);
      const res = await fetch("/api/shopee-imports", { method: "POST", body });
      const data = (await res.json()) as ImportResult & { error?: string };
      if (!res.ok) throw new Error(data.error || "Nhập dữ liệu thất bại.");
      setResult(data);
      setPending(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nhập dữ liệu thất bại.");
      setPending(null);
    } finally {
      setBusy(false);
    }
  }

  const warnings = result
    ? [
        result.outOfRangeCount > 0 &&
          `${result.outOfRangeCount} dòng có ngày nằm ngoài khoảng của tên tệp nên đã bị bỏ qua.`,
        result.unparsedDateCount > 0 &&
          `${result.unparsedDateCount} dòng không đọc được ngày đặt hàng nên đã bị bỏ qua.`,
        result.skippedNoCode > 0 &&
          `${result.skippedNoCode} dòng không có mã đơn hàng nên đã bị bỏ qua.`,
      ].filter((w): w is string => Boolean(w))
    : [];

  return (
    <div className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
      <div className="border-b border-[#E4E7EC] px-4 py-4 sm:px-5">
        <h3 className="text-lg font-semibold text-[#1D2939]">
          Nhập dữ liệu Shopee
        </h3>
        <p className="mt-1 text-sm text-[#667085]">
          Tải lên tệp .xlsx xuất từ Shopee. Tên tệp phải theo định dạng{" "}
          <code className="rounded bg-[#F2F4F7] px-1.5 py-0.5 text-[13px] text-[#344054]">
            shoppe_1-8_30-8.xlsx
          </code>{" "}
          (ngày-tháng bắt đầu, ngày-tháng kết thúc).
        </p>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#465FFF] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#3641F5] disabled:opacity-50 sm:w-auto"
        >
          <Upload className="h-4 w-4" />
          {busy ? "Đang tải lên…" : "Chọn tệp .xlsx"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          onChange={onPick}
          className="hidden"
        />

        {error && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#FEF3F2] px-3 py-2.5 text-sm text-[#B42318]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {result && (
          <div className="mt-3 rounded-lg bg-[#ECFDF3] px-3 py-2.5 text-sm text-[#027A48]">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Đã nhập <strong>{result.rowCount}</strong> dòng ·{" "}
                <strong>{result.orderCount}</strong> đơn · doanh thu{" "}
                <strong>{formatVnd(result.totalRevenue)}</strong>
                {result.replacedRowCount > 0 && (
                  <> · thay thế {result.replacedRowCount} dòng cũ</>
                )}
              </span>
            </p>
            {warnings.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-9 text-[#B54708]">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(o) => !o && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận khoảng ngày</AlertDialogTitle>
            <AlertDialogDescription>
              {pending && (
                <>
                  Tệp <strong>{pending.file.name}</strong> sẽ được nhập cho
                  khoảng{" "}
                  <strong>
                    {formatDayKey(pending.range.from)} →{" "}
                    {formatDayKey(pending.range.to)}
                  </strong>
                  . Toàn bộ dữ liệu Shopee hiện có trong khoảng ngày này sẽ bị
                  thay thế.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void onConfirm();
              }}
            >
              {busy ? "Đang nhập…" : "Nhập dữ liệu"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
