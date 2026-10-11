"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Spinner } from "@repo/ui/components/Spinner";

/** `icon`: compact topbar button. `row`: full-width list row (mobile sheet). */
export function LogoutButton({ variant = "icon" }: { variant?: "icon" | "row" }) {
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

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className="flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 text-left text-[15px] font-medium text-[#B42318] active:bg-[#FEF3F2] disabled:opacity-60"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FEF3F2]">
          {busy ? <Spinner /> : <LogOut className="h-[18px] w-[18px]" />}
        </span>
        Đăng xuất
      </button>
    );
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
