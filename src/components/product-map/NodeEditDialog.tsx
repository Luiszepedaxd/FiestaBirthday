import { useEffect, useState } from "react";
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
import { PRODUCT_MAP_PRESET_COLORS } from "./constants";
import { cn } from "@/lib/utils";

type NodeEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  initialName?: string;
  initialColor?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (values: { name: string; color: string }) => void;
};

export function NodeEditDialog({
  open,
  onOpenChange,
  title,
  description,
  initialName = "",
  initialColor = PRODUCT_MAP_PRESET_COLORS[0],
  submitLabel = "Guardar",
  isSubmitting = false,
  onSubmit,
}: NodeEditDialogProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setColor(initialColor);
    }
  }, [open, initialName, initialColor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({ name: trimmed, color });
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
          <div className="space-y-2">
            <Label className="text-[#2E2D2C]">Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_MAP_PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-label={`Color ${preset}`}
                  onClick={() => setColor(preset)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                    color === preset ? "border-[#2E2D2C] ring-2 ring-[#C6017F]" : "border-white",
                  )}
                  style={{ backgroundColor: preset }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-[#E5E5E5]"
                aria-label="Selector de color personalizado"
              />
              <span className="font-mono text-xs text-[#717B99]">{color}</span>
            </div>
          </div>
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
