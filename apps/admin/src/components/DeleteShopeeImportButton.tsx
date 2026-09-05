"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/ui/alert-dialog";
import { Spinner } from "@repo/ui/components/Spinner";

// Deletes one import and every row it created, then refreshes the report.
export function DeleteShopeeImportButton({
  id,
  filename,
}: {
  id: string;
  filename: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onConfirm() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/shopee-imports/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
      setOpen(false);
      router.refresh();
    } catch {
      window.alert("Không thể xóa lần nhập này. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => setOpen(next)}>
      <AlertDialogTrigger
        aria-label={`Xóa lần nhập ${filename}`}
        className="inline-flex items-center justify-center rounded-lg p-2 text-[#B42318] transition hover:bg-[#FEF3F2] disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa lần nhập này?</AlertDialogTitle>
          <AlertDialogDescription>
            Toàn bộ dòng dữ liệu từ tệp <strong>{filename}</strong> sẽ bị xóa
            khỏi báo cáo. Hành động này không thể hoàn tác — muốn khôi phục thì
            phải tải lại tệp từ Shopee.
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
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Spinner />
                Đang xóa…
              </span>
            ) : (
              "Xóa"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
