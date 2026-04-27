"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

// Minimal modal overlay
// Click backdrop or X to close
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto max-w-md w-full rounded border border-border bg-bg p-0
                 backdrop:bg-black/20 backdrop:backdrop-blur-[2px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text transition-colors"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">{children}</div>
    </dialog>
  );
}
