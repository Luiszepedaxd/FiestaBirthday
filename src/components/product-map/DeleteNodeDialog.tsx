import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DeleteNodeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeName: string;
  childCount: number;
  isDeleting?: boolean;
  onConfirm: () => void;
};

export function DeleteNodeDialog({
  open,
  onOpenChange,
  nodeName,
  childCount,
  isDeleting = false,
  onConfirm,
}: DeleteNodeDialogProps) {
  const hasChildren = childCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm rounded-2xl border-[#E5E5E5]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#2E2D2C]">¿Eliminar nodo?</AlertDialogTitle>
          <AlertDialogDescription className="text-[#717B99]">
            Vas a eliminar <strong className="text-[#2E2D2C]">{nodeName}</strong>.
            {hasChildren ? (
              <>
                {" "}
                Este nodo tiene <strong>{childCount}</strong> hijo
                {childCount === 1 ? "" : "s"} directo
                {childCount === 1 ? "" : "s"} que también se eliminarán (cascada).
              </>
            ) : (
              " Esta acción no se puede deshacer."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl" disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
