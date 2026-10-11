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
import { useToast } from "@repo/ui/components/ui/toast";

// Deletes one import and every row it created, then refreshes the report.
export function DeleteShopeeImportButton({
  id,
  filename,
}: {
  id: string;
  filename: string;
}) {
  const router = useRouter();
  const toast = useToast();
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
      toast.success("Đã xóa lần nhập");
      router.refresh();
    } catch {
      toast.error("Không thể xóa lần nhập này", "Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => setOpen(next)}>
      <AlertDialogTrigger
        aria-label={`Xóa lần nhập ${filename}`}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#B42318] transition hover:bg-[#FEF3F2] active:bg-[#FEF3F2] disabled:opacity-50 lg:h-9 lg:w-9"
      >
        <Trash2 className="h-4 w-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa lần nhập này?</AlertDialogTitle>
          <AlertDialogDescription>
            Toàn bộ dòng dữ liệu từ tệp <strong className="break-all">{filename}</strong> sẽ bị xóa
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
