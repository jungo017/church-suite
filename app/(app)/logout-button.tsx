"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={async () => {
        setLoading(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      disabled={loading}
      className="rounded-md px-2 py-1.5 text-left text-sm text-gray-500 hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
    >
      {loading ? "로그아웃 중…" : "로그아웃"}
    </button>
  );
}
