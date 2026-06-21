"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
    >
      인쇄
    </button>
  );
}
