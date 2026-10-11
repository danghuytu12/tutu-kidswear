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
import { useToast } from "@repo/ui/components/ui/toast";
import { cn } from "@repo/ui/lib/utils";
import { Spinner } from "@repo/ui/components/Spinner";

// Deletes a product after confirming through an AlertDialog, then refreshes the
// (server-rendered) list. `className` lets the mobile card render a wider,
// easier-to-tap variant.
export function DeleteProductButton({
  id,
  name,
  className,
}: {
  id: string;
  name?: string;
  className?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onConfirm() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setOpen(false);
      toast.success("Đã xóa sản phẩm", name);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Không thể xóa sản phẩm", "Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        aria-label={name ? `Xóa ${name}` : "Xóa sản phẩm"}
        disabled={busy || pending}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#FEF3F2] hover:text-[#B42318] disabled:opacity-50",
          className,
        )}
      >
        {busy || pending ? <Spinner /> : <Trash2 className="h-4 w-4" />}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
          <AlertDialogDescription>
            {name ? (
              <>
                <strong className="wrap-break-word text-[#344054]">{name}</strong>{" "}
                sẽ bị xóa vĩnh viễn khỏi cửa hàng.
              </>
            ) : (
              "Sản phẩm sẽ bị xóa vĩnh viễn khỏi cửa hàng."
            )}{" "}
            Hành động này không thể hoàn tác.
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
