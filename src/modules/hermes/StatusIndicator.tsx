"use client";

// Tiny dot showing Hermes online/offline status
// Green pulse = online, dim red = offline

import { useEffect, useState } from "react";
import { onStatusChange, startSync } from "@/lib/sync";
import type { HermesStatus } from "@/lib/hermes";

export function StatusIndicator({ showLabel = false }: { showLabel?: boolean }) {
  const [status, setStatus] = useState<HermesStatus>({ online: false });

  useEffect(() => {
    startSync();
    return onStatusChange(setStatus);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          status.online
            ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"
            : "bg-red-900/60"
        }`}
      />
      {showLabel && (
        <span className="text-[10px] text-text-muted">
          {status.online ? "Online" : "Offline"}
        </span>
      )}
    </div>
  );
}
