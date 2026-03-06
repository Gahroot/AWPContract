"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export function RoleWarnings() {
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/commissions/validate")
      .then((res) => (res.ok ? res.json() : { warnings: [] }))
      .then((data) => setWarnings(data.warnings ?? []))
      .catch(() => {});
  }, []);

  if (warnings.length === 0) return null;

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Commission Configuration Warnings
          </h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
