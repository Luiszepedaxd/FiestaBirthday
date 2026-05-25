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
import { useAddClickUpLink } from "@/hooks/useProductMapClickup";
import { extractTaskIdFromUrl, isValidClickUpUrl } from "@/lib/clickup-utils";
import { cn } from "@/lib/utils";

type AddClickUpLinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
};

export function AddClickUpLinkDialog({
  open,
  onOpenChange,
  nodeId,
}: AddClickUpLinkDialogProps) {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const addLink = useAddClickUpLink();

  useEffect(() => {
    if (open) {
      setUrl("");
      setAlias("");
    }
  }, [open]);

  const trimmedUrl = url.trim();
  const urlValid = trimmedUrl.length > 0 && isValidClickUpUrl(trimmedUrl);
  const urlInvalid = trimmedUrl.length > 0 && !urlValid;
  const detectedTaskId = useMemo(
    () => (urlValid ? extractTaskIdFromUrl(trimmedUrl) : null),
    [trimmedUrl, urlValid],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlValid) return;
    addLink.mutate(
      {
        node_id: nodeId,
        clickup_url: trimmedUrl,
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
          <DialogTitle>Agregar task de ClickUp</DialogTitle>
          <DialogDescription>
            Pega la URL de la task en app.clickup.com para ligarla a este nodo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clickup-url">URL de ClickUp</Label>
            <Input
              id="clickup-url"
              type="url"
              placeholder="https://app.clickup.com/t/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={cn(
                "rounded-xl",
                urlInvalid && "border-destructive focus-visible:ring-destructive",
              )}
              autoComplete="off"
            />
            {urlInvalid && (
              <p className="text-xs text-destructive">
                Debe ser una URL de app.clickup.com
              </p>
            )}
            {urlValid && detectedTaskId && (
              <p className="text-xs text-[#717B99]">ID detectado: {detectedTaskId}</p>
            )}
            {urlValid && !detectedTaskId && (
              <p className="text-xs text-[#717B99]">
                URL válida; el ID se extraerá al guardar si está en el enlace.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clickup-alias">Nombre / Alias</Label>
            <Input
              id="clickup-alias"
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
              disabled={addLink.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-[#7B68EE] hover:bg-[#6A58DE]"
              disabled={!urlValid || addLink.isPending}
            >
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
