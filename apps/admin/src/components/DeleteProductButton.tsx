"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

// Deletes a product via the admin API and refreshes the (server-rendered) list.
export function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      aria-label="Delete product"
      onClick={onDelete}
      disabled={busy}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#FEF3F2] hover:text-[#B42318] disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
