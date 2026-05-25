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
import { useUpdateClickUpLink } from "@/hooks/useProductMapClickup";
import type { ClickUpLink } from "@/types/product-map";

type EditClickUpLinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: ClickUpLink | null;
};

export function EditClickUpLinkDialog({
  open,
  onOpenChange,
  link,
}: EditClickUpLinkDialogProps) {
  const [alias, setAlias] = useState("");
  const updateLink = useUpdateClickUpLink();

  useEffect(() => {
    if (open && link) {
      setAlias(link.task_name ?? "");
    }
  }, [open, link]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;
    updateLink.mutate(
      {
        id: link.id,
        node_id: link.node_id,
        task_name: alias.trim() || null,
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar alias</DialogTitle>
          <DialogDescription>
            Personaliza cómo se muestra esta task en el mapa. La URL no se modifica.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-clickup-alias">Nombre / Alias</Label>
            <Input
              id="edit-clickup-alias"
              type="text"
              placeholder="Ej: Implementar signup OTP (opcional)"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="rounded-xl"
            />
            <p className="text-xs text-[#717B99]">
              Si lo dejas vacío, se mostrará el ID de la task
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={updateLink.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-[#7B68EE] hover:bg-[#6A58DE]"
              disabled={updateLink.isPending}
            >
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
