"use client";

import { useState } from "react";

interface PendingReport {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
}

export function ReportQueue({
  initialReports,
}: {
  initialReports: PendingReport[];
}) {
  const [reports, setReports] = useState(initialReports);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(reportId: string, action: "resolve" | "dismiss") {
    setPendingId(reportId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/${action}`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(
          typeof data.error === "string" ? data.error : `Failed to ${action}`,
        );
        return;
      }
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm">
      <div className="border-border bg-muted/30 border-b px-5 py-4">
        <h2 className="text-base font-bold">Reports</h2>
      </div>

      {error ? (
        <p className="text-destructive px-5 pt-4 text-sm">{error}</p>
      ) : null}

      {reports.length === 0 ? (
        <p className="text-muted-foreground p-5 text-sm">No pending reports.</p>
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-destructive/5 border-destructive flex flex-col gap-2 rounded-r-xl border-l-4 p-4"
            >
              <span className="bg-destructive w-fit rounded px-2 py-0.5 text-[9px] font-bold text-white uppercase">
                {report.targetType}
              </span>
              <p className="text-muted-foreground text-xs">
                Target: {report.targetId}
              </p>
              <p className="text-sm leading-relaxed italic">
                &ldquo;{report.reason}&rdquo;
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={pendingId === report.id}
                  onClick={() => act(report.id, "resolve")}
                  className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-bold disabled:opacity-50"
                >
                  Resolve
                </button>
                <button
                  type="button"
                  disabled={pendingId === report.id}
                  onClick={() => act(report.id, "dismiss")}
                  className="text-muted-foreground hover:bg-muted rounded-full px-3 py-1 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
