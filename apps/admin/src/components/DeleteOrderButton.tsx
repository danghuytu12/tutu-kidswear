"use client";

import { useState, useTransition } from "react";
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
import { cn } from "@repo/ui/lib/utils";
import { Spinner } from "@repo/ui/components/Spinner";

// Deletes one order after confirming through a shadcn AlertDialog, then
// refreshes the server-rendered list. `className` lets the mobile card render a
// wider, easier-to-tap variant.
export function DeleteOrderButton({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onConfirm() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setOpen(false);
      startTransition(() => router.refresh());
    } catch {
      window.alert("Không thể xóa đơn hàng. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => setOpen(next)}>
      <AlertDialogTrigger
        aria-label="Xóa đơn hàng"
        className={cn(
          "inline-flex items-center justify-center rounded-lg p-2 text-[#B42318] transition hover:bg-[#FEF3F2] disabled:opacity-50",
          className,
        )}
      >
        {busy || pending ? <Spinner /> : <Trash2 className="h-4 w-4" />}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa đơn hàng?</AlertDialogTitle>
          <AlertDialogDescription>
            Hành động này không thể hoàn tác. Đơn hàng sẽ bị xóa vĩnh viễn khỏi
            hệ thống.
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
