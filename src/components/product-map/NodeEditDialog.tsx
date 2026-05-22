import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUS_CONFIG,
  STATUS_ORDER,
  getStatusLabel,
  getStatusProgress,
} from "@/lib/product-map-status";
import type { ProductMapStatus } from "@/types/product-map";

type NodeEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  initialName?: string;
  initialStatus?: ProductMapStatus;
  hasChildren?: boolean;
  submitLabel?: string;
  isSubmitting?: boolean;
  showStatusField?: boolean;
  onSubmit: (values: { name: string; status: ProductMapStatus }) => void;
};

export function NodeEditDialog({
  open,
  onOpenChange,
  title,
  description,
  initialName = "",
  initialStatus = "not_started",
  hasChildren = false,
  submitLabel = "Guardar",
  isSubmitting = false,
  showStatusField = true,
  onSubmit,
}: NodeEditDialogProps) {
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<ProductMapStatus>(initialStatus);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setStatus(initialStatus);
    }
  }, [open, initialName, initialStatus]);

  const progressPreview = useMemo(() => {
    if (hasChildren) return null;
    const p = getStatusProgress(status);
    if (p === null) return null;
    return p;
  }, [hasChildren, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({ name: trimmed, status });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border-[#E5E5E5] bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#2E2D2C]">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-[#717B99]">{description}</DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="node-name" className="text-[#2E2D2C]">
              Nombre
            </Label>
            <Input
              id="node-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del nodo"
              className="rounded-xl border-[#E5E5E5] focus-visible:ring-[#C6017F]"
              autoFocus
            />
          </div>

          {showStatusField && (
            <div className="space-y-2">
              <Label className="text-[#2E2D2C]">Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProductMapStatus)}>
                <SelectTrigger className="rounded-xl border-[#E5E5E5] focus:ring-[#C6017F]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: STATUS_CONFIG[s].color }}
                        />
                        {getStatusLabel(s)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {progressPreview !== null && (
                <p className="text-xs text-[#717B99]">
                  Este nodo se mostrará al{" "}
                  <strong className="text-[#2E2D2C]">{progressPreview}%</strong>
                </p>
              )}
              {status === "untracked" && !hasChildren && (
                <p className="text-xs text-[#717B99]">No participa en el cálculo del progreso del padre.</p>
              )}
              {hasChildren && (
                <p className="text-xs text-[#717B99]">
                  El progreso de este nodo se calcula automáticamente desde sus hijos. Cambiar el
                  estado aquí solo afecta cómo se cuenta en el cálculo del padre.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="rounded-xl bg-[#C6017F] hover:bg-[#B10072]"
            >
              {isSubmitting ? "Guardando..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
