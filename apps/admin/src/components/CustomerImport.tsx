"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Download, Upload } from "lucide-react";
import { Spinner } from "@repo/ui/components/Spinner";

interface ImportResult {
  inserted: number;
  updated: number;
  rowCount: number;
  skippedNoName: number;
  skippedNoPhone: number;
  duplicateInFile: number;
}

/**
 * Import customers from a spreadsheet.
 *
 * No confirmation step, unlike the Shopee importer: that one clears a date
 * range before writing, while this upserts on phone and never deletes, so a
 * mistaken upload costs nothing but a re-import.
 */
export function CustomerImport() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [, startTransition] = useTransition();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Let the same file be picked again after a failed attempt.
    e.target.value = "";
    if (!file || busy) return;

    setError("");
    setResult(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/customers", { method: "POST", body });
      const data = (await res.json()) as ImportResult & { error?: string };
      if (!res.ok) throw new Error(data.error || "Nhập dữ liệu thất bại.");
      setResult(data);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nhập dữ liệu thất bại.");
    } finally {
      setBusy(false);
    }
  }

  const warnings = result
    ? [
        result.skippedNoName > 0 &&
          `${result.skippedNoName} dòng không có họ tên nên đã bị bỏ qua.`,
        result.skippedNoPhone > 0 &&
          `${result.skippedNoPhone} dòng không có số điện thoại hợp lệ nên đã bị bỏ qua.`,
        result.duplicateInFile > 0 &&
          `${result.duplicateInFile} dòng trùng số điện thoại trong cùng tệp — chỉ dòng cuối được dùng.`,
      ].filter((w): w is string => Boolean(w))
    : [];

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
      <div className="border-b border-[#E4E7EC] px-4 py-4 sm:px-5">
        <h3 className="text-lg font-semibold text-[#1D2939]">
          Nhập khách hàng từ Excel
        </h3>
        <p className="mt-1 text-sm text-[#667085]">
          Tải file mẫu, điền thông tin rồi tải lên. Khách trùng{" "}
          <strong>số điện thoại</strong> sẽ được cập nhật thay vì tạo mới, nên
          nhập lại nhiều lần vẫn an toàn.
        </p>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="/api/customers/template"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-4 py-2.5 text-sm font-medium text-[#344054] transition hover:bg-gray-50 sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Tải file mẫu
          </a>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#465FFF] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#3641F5] disabled:opacity-50 sm:w-auto"
          >
            {busy ? (
              <>
                <Spinner />
                Đang nhập…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Chọn tệp .xlsx
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            onChange={onPick}
            className="hidden"
          />
        </div>

        {error && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#FEF3F2] px-3 py-2.5 text-sm text-[#B42318]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {result && (
          <div className="mt-3 rounded-lg bg-[#ECFDF3] px-3 py-2.5 text-sm text-[#027A48]">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Đã thêm mới <strong>{result.inserted}</strong> khách · cập nhật{" "}
                <strong>{result.updated}</strong> khách
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
    </div>
  );
}
