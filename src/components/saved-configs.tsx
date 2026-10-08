import { useCallback, useEffect, useState } from "react";
import { Database, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ArrayConfig, SavedConfig } from "@/lib/config-schema";
import {
  deleteConfig,
  getConfigStoreStatus,
  listConfigs,
  saveConfig,
} from "@/lib/config-store";
import { cn } from "@/lib/utils";

type Status = "checking" | "ready" | "unconfigured" | "error";

export function SavedConfigs({
  current,
  onLoad,
}: {
  current: Omit<ArrayConfig, "name">;
  onLoad: (cfg: SavedConfig) => void;
}) {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string>();
  const [items, setItems] = useState<SavedConfig[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [armedDelete, setArmedDelete] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setItems(await listConfigs());
    } catch (err) {
      toast.error(`Could not load configurations: ${(err as Error).message}`);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    getConfigStoreStatus()
      .then(async (s) => {
        if (!alive) return;
        if (!s.configured) return setStatus("unconfigured");
        if (!s.ok) {
          setError(s.error);
          return setStatus("error");
        }
        setStatus("ready");
        await refresh();
      })
      .catch((err) => {
        if (!alive) return;
        setError((err as Error).message);
        setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, [refresh]);

  async function onSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await saveConfig({ data: { ...current, name: trimmed } });
      toast.success(`Saved "${trimmed}"`);
      await refresh();
    } catch (err) {
      toast.error(`Save failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(target: string) {
    if (armedDelete !== target) {
      setArmedDelete(target);
      setTimeout(() => setArmedDelete((v) => (v === target ? null : v)), 3000);
      return;
    }
    setArmedDelete(null);
    try {
      await deleteConfig({ data: { name: target } });
      toast.success(`Deleted "${target}"`);
      await refresh();
    } catch (err) {
      toast.error(`Delete failed: ${(err as Error).message}`);
    }
  }

  const exists = items.some((i) => i.name === name.trim());

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <Label>Saved configurations</Label>
        <span
          className={cn(
            "inline-flex items-center gap-1 font-mono text-xs",
            status === "ready" ? "text-subtle" : status === "checking" ? "text-subtle" : "text-warn",
          )}
          title={error}
        >
          <Database className="size-3" />
          {status === "ready" && "MongoDB"}
          {status === "checking" && "connecting"}
          {status === "unconfigured" && "not configured"}
          {status === "error" && "offline"}
        </span>
      </div>

      {status === "unconfigured" && (
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Set <code className="font-mono">MONGODB_URI</code> in <code className="font-mono">.env</code> and
          restart the app to save designs.
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 break-words text-xs leading-relaxed text-warn">
          Could not reach the database. {error}
        </p>
      )}

      {status === "ready" && (
        <>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void onSave();
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name this design"
              maxLength={80}
              className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-3 text-sm text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            />
            <Button type="submit" size="sm" disabled={busy || !name.trim()}>
              <Save />
              {exists ? "Update" : "Save"}
            </Button>
          </form>

          <ul className="mt-3 flex max-h-64 flex-col gap-1.5 overflow-y-auto">
            {items.length === 0 && <li className="text-xs text-subtle">Nothing saved yet.</li>}
            {items.map((cfg) => (
              <li
                key={cfg.id}
                className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    onLoad(cfg);
                    setName(cfg.name);
                    toast.success(`Loaded "${cfg.name}"`);
                  }}
                  title="Load this design"
                >
                  <div className="truncate text-sm font-medium text-fg">{cfg.name}</div>
                  <div className="truncate font-mono text-xs text-subtle">
                    {cfg.geometry} · {cfg.n} mics · {cfg.spacingCm} cm
                  </div>
                </button>
                <Upload className="size-3.5 shrink-0 text-subtle" aria-hidden />
                <button
                  type="button"
                  onClick={() => void onDelete(cfg.name)}
                  className={cn(
                    "shrink-0 rounded p-1 text-xs",
                    armedDelete === cfg.name ? "text-warn" : "text-subtle hover:text-fg",
                  )}
                  title={armedDelete === cfg.name ? "Click again to delete" : "Delete"}
                >
                  {armedDelete === cfg.name ? "Confirm" : <Trash2 className="size-3.5" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
