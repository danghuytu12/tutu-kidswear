"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Spinner } from "@repo/ui/components/Spinner";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    // Left busy on purpose: the button unmounts with the redirect.
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      aria-label="Đăng xuất"
      onClick={logout}
      disabled={busy}
      className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-[14px] text-black/60 hover:bg-[#f2ece3] disabled:opacity-60"
    >
      {busy ? <Spinner /> : <LogOut className="h-4 w-4" />}
      <span className="hidden sm:inline">Đăng xuất</span>
    </button>
  );
}
