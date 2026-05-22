import type { ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

type NodeContextMenuProps = {
  children: ReactNode;
  onAddChild: () => void;
  onRename: () => void;
  onChangeColor: () => void;
  onDelete: () => void;
  canDelete?: boolean;
};

export function NodeContextMenu({
  children,
  onAddChild,
  onRename,
  onChangeColor,
  onDelete,
  canDelete = true,
}: NodeContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48 rounded-xl border-[#E5E5E5]">
        <ContextMenuItem onSelect={onAddChild}>Agregar hijo</ContextMenuItem>
        <ContextMenuItem onSelect={onRename}>Renombrar</ContextMenuItem>
        <ContextMenuItem onSelect={onChangeColor}>Cambiar color</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={onDelete}
          disabled={!canDelete}
          className="text-destructive focus:text-destructive"
        >
          Eliminar
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
