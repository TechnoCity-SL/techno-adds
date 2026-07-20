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
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h2 className="mb-4 text-xl font-semibold">Reports</h2>
      {error ? <p className="text-destructive mb-4 text-sm">{error}</p> : null}

      {reports.length === 0 ? (
        <p className="text-muted-foreground text-sm">No pending reports.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="border-border flex flex-col gap-2 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-muted-foreground text-xs uppercase">
                  {report.targetType} · {report.targetId}
                </p>
                <p className="text-sm">{report.reason}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pendingId === report.id}
                  onClick={() => act(report.id, "resolve")}
                  className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Resolve
                </button>
                <button
                  type="button"
                  disabled={pendingId === report.id}
                  onClick={() => act(report.id, "dismiss")}
                  className="border-border rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Dismiss
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
