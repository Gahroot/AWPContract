"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { type UseFormWatch } from "react-hook-form";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFormValues = Record<string, any>;

interface UseAutoSaveOptions {
  watch: UseFormWatch<AnyFormValues>;
  contractId: string | null;
  onSave: (data: AnyFormValues) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutoSave({
  watch,
  contractId,
  onSave,
  debounceMs = 2000,
  enabled = true,
}: UseAutoSaveOptions) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dataRef = useRef<AnyFormValues | null>(null);

  const save = useCallback(async () => {
    if (!contractId || !dataRef.current) return;
    setSaving(true);
    try {
      await onSave(dataRef.current);
      setLastSaved(new Date());
    } catch {
      toast.error("Auto-save failed");
    } finally {
      setSaving(false);
    }
  }, [contractId, onSave]);

  useEffect(() => {
    if (!enabled) return;

    const subscription = watch((data) => {
      dataRef.current = data;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(save, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [watch, save, debounceMs, enabled]);

  return { saving, lastSaved };
}
