"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /evaluate is merged into /pipeline.
// Redirect here so existing links (scanner, dashboard, etc.) keep working.
export default function EvaluateRedirect() {
  const router = useRouter();

  useEffect(() => {
    const url = new URLSearchParams(window.location.search).get("url");
    if (url) {
      router.replace(`/pipeline?url=${encodeURIComponent(url)}`);
    } else {
      router.replace("/pipeline");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-[#888] text-sm">Redirecting…</p>
    </div>
  );
}
