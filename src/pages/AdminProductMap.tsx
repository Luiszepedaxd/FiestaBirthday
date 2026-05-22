import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CircleDot, GitBranch, Home, Plus } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsAdmin } from "@/lib/auth";
import {
  useCreateNode,
  useDeleteNode,
  useGlobalProgress,
  useMapTrackingStats,
  useNodePath,
  useNodesByParent,
  useProductMapNode,
  useRootNode,
  useUpdateNode,
} from "@/hooks/useProductMap";
import { useAllProductMapNodes } from "@/hooks/useAllProductMapNodes";
import { ProductMapCanvas } from "@/components/product-map/ProductMapCanvas";
import { ProductMapPanoramic } from "@/components/product-map/ProductMapPanoramic";
import { ProductMapBreadcrumb } from "@/components/product-map/ProductMapBreadcrumb";
import { NodeEditDialog } from "@/components/product-map/NodeEditDialog";
import { DeleteNodeDialog } from "@/components/product-map/DeleteNodeDialog";
import { PRODUCT_MAP_BG } from "@/components/product-map/constants";
import {
  getStoredProductMapViewMode,
  setStoredProductMapViewMode,
  type ProductMapViewMode,
} from "@/lib/product-map-view-mode";
import type { ProductMapNodeWithProgress, ProductMapStatus } from "@/types/product-map";

type EditMode = "create" | "edit" | null;

type ContextMenuState = {
  node: ProductMapNodeWithProgress;
  x: number;
  y: number;
};

const AdminProductMap = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: root, isLoading: rootLoading, error: rootError } = useRootNode();
  const { data: globalData, isLoading: globalLoading } = useGlobalProgress();
  const { data: trackingStats } = useMapTrackingStats();
  const [viewMode, setViewMode] = useState<ProductMapViewMode>(() => getStoredProductMapViewMode());
  const [focusId, setFocusId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [editTarget, setEditTarget] = useState<ProductMapNodeWithProgress | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductMapNodeWithProgress | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const centerId = focusId ?? root?.id ?? null;
  const { data: centerNode, isLoading: centerLoading } = useProductMapNode(centerId);
  const {
    data: childNodes = [],
    isLoading: childrenLoading,
    error: childrenError,
  } = useNodesByParent(centerId);
  const { data: path = [] } = useNodePath(centerId);
  const { data: deleteChildNodes = [] } = useNodesByParent(deleteTarget?.id ?? null);
  const {
    data: allPanoramicNodes = [],
    isLoading: allNodesLoading,
    error: allNodesError,
  } = useAllProductMapNodes();

  const createNode = useCreateNode();
  const updateNode = useUpdateNode();
  const deleteNode = useDeleteNode();

  const rootName = globalData?.root?.name ?? root?.name ?? "Mapa";
  const globalProgress = globalData?.progress ?? root?.calculated_progress ?? null;

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [adminLoading, isAdmin, navigate]);

  useEffect(() => {
    if (root?.id && focusId === null) {
      setFocusId(root.id);
    }
  }, [root?.id, focusId]);

  useEffect(() => {
    if (rootError) {
      toast.error("No se pudo cargar el mapa de producto");
    }
    if (childrenError) {
      toast.error("No se pudieron cargar los nodos hijos");
    }
  }, [rootError, childrenError]);

  useEffect(() => {
    if (allNodesError) {
      toast.error("No se pudo cargar la vista panorámica");
    }
  }, [allNodesError]);

  const handleViewModeChange = useCallback((mode: ProductMapViewMode) => {
    setViewMode(mode);
    setStoredProductMapViewMode(mode);
    setContextMenu(null);
  }, []);

  const handlePanoramicNodeClick = useCallback(
    (node: ProductMapNodeWithProgress) => {
      setFocusId(node.id);
      handleViewModeChange("mindly");
    },
    [handleViewModeChange],
  );

  const canGoBack = Boolean(centerNode?.parent_id);

  const goBack = useCallback(() => {
    if (centerNode?.parent_id) {
      setFocusId(centerNode.parent_id);
    }
  }, [centerNode?.parent_id]);

  const resetToRoot = useCallback(() => {
    if (root?.id) {
      setFocusId(root.id);
      toast.message("Vista reiniciada en la raíz");
    }
  }, [root?.id]);

  useEffect(() => {
    if (viewMode !== "mindly") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (canGoBack) {
          e.preventDefault();
          goBack();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewMode, canGoBack, goBack]);

  const openCreateDialog = (parent: ProductMapNodeWithProgress) => {
    setEditTarget(parent);
    setEditMode("create");
    setContextMenu(null);
  };

  const openEditDialog = (node: ProductMapNodeWithProgress) => {
    setEditTarget(node);
    setEditMode("edit");
    setContextMenu(null);
  };

  const openDeleteDialog = (node: ProductMapNodeWithProgress) => {
    setDeleteTarget(node);
    setContextMenu(null);
  };

  const handleNodeContextMenu = (node: ProductMapNodeWithProgress, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ node, x: event.clientX, y: event.clientY });
  };

  const handleEditSubmit = async (values: { name: string; status: ProductMapStatus }) => {
    if (!editTarget) return;

    try {
      if (editMode === "create") {
        await createNode.mutateAsync({
          name: values.name,
          parent_id: editTarget.id,
          status: values.status,
        });
        toast.success("Nodo creado");
      } else if (editMode === "edit") {
        const isLeaf = (editTarget.children_count ?? 0) === 0;
        await updateNode.mutateAsync({
          id: editTarget.id,
          parent_id: editTarget.parent_id,
          name: values.name,
          ...(isLeaf ? { status: values.status } : {}),
        });
        toast.success("Nodo actualizado");
      }
      setEditMode(null);
      setEditTarget(null);
    } catch {
      toast.error("Error al guardar el nodo");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const parentId = deleteTarget.parent_id;
    const wasFocused = deleteTarget.id === centerId;

    try {
      await deleteNode.mutateAsync({
        id: deleteTarget.id,
        parent_id: deleteTarget.parent_id,
      });
      toast.success("Nodo eliminado");
      setDeleteTarget(null);
      if (wasFocused && parentId) {
        setFocusId(parentId);
      } else if (wasFocused && root?.id) {
        setFocusId(root.id);
      }
    } catch {
      toast.error("Error al eliminar el nodo");
    }
  };

  const isPageLoading = adminLoading || rootLoading || !centerNode;
  const isGraphLoading = centerLoading || childrenLoading;

  const progressBarValue = globalProgress ?? 0;
  const progressLabel =
    globalProgress === null ? "Sin tracking global" : `Avance global: ${globalProgress}%`;

  if (!adminLoading && !isAdmin) {
    return null;
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: PRODUCT_MAP_BG, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <header className="sticky top-0 z-40 border-b border-[#F2F2F2] bg-white/95 backdrop-blur-sm">
        <div
          className={`mx-auto w-full px-4 py-3 ${viewMode === "panoramic" ? "max-w-[1600px]" : "max-w-5xl"}`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-[#717B99] hover:text-[#C6017F]"
                onClick={() => navigate("/admin")}
                aria-label="Volver al admin"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={viewMode}
                onValueChange={(value) => {
                  if (value === "mindly" || value === "panoramic") {
                    handleViewModeChange(value);
                  }
                }}
                className="shrink-0 rounded-xl border border-[#E5E5E5] bg-white p-0.5"
                aria-label="Modo de vista del mapa"
              >
                <ToggleGroupItem
                  value="mindly"
                  className="rounded-lg px-3 data-[state=on]:bg-[#FFF0F9] data-[state=on]:text-[#C6017F]"
                  aria-label="Vista Foco"
                >
                  <CircleDot className="mr-1.5 h-4 w-4" />
                  Foco
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="panoramic"
                  className="rounded-lg px-3 data-[state=on]:bg-[#FFF0F9] data-[state=on]:text-[#C6017F]"
                  aria-label="Vista Panorámica"
                >
                  <GitBranch className="mr-1.5 h-4 w-4" />
                  Panorámica
                </ToggleGroupItem>
              </ToggleGroup>
              {viewMode === "mindly" &&
                (isPageLoading ? (
                  <Skeleton className="h-5 w-48" />
                ) : (
                  <ProductMapBreadcrumb
                    path={path}
                    onNavigate={(nodeId) => setFocusId(nodeId)}
                  />
                ))}
            </div>
            {viewMode === "mindly" && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-[#E5E5E5] text-[#2E2D2C] hover:bg-[#FFF0F9]"
                        onClick={resetToRoot}
                        disabled={!root || centerId === root.id}
                      >
                        <Home className="mr-1.5 h-4 w-4" />
                        Inicio
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="rounded-lg border-[#E5E5E5] bg-white text-[#2E2D2C]"
                    >
                      Volver al nodo raíz
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl bg-[#C6017F] hover:bg-[#B10072]"
                  onClick={() => centerNode && openCreateDialog(centerNode)}
                  disabled={!centerNode}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Agregar nodo
                </Button>
              </div>
            )}
          </div>

          <div className="mt-3 rounded-xl border border-[#F2F2F2] bg-[#FAF8F5] px-4 py-3">
            {globalLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <>
                <p className="text-sm font-semibold text-[#2E2D2C]">
                  {rootName} · {progressLabel}
                </p>
                <Progress
                  value={progressBarValue}
                  className="mt-2 h-2.5 bg-[#E5E5E5] [&>div]:bg-[#C6017F]"
                />
                {trackingStats && (
                  <p className="mt-2 text-xs text-[#717B99]">
                    {trackingStats.tracked} pantallas con tracking · {trackingStats.untracked} sin
                    tracking
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main
        className={`mx-auto flex min-h-0 w-full flex-1 flex-col px-2 py-4 sm:px-4 ${
          viewMode === "panoramic" ? "max-w-[1600px]" : "max-w-5xl"
        }`}
      >
        <AnimatePresence mode="wait">
          {viewMode === "mindly" ? (
            <motion.div
              key="mindly"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col"
            >
              {isPageLoading ? (
                <div className="flex flex-1 items-center justify-center p-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#C6017F] border-t-transparent" />
                </div>
              ) : (
                <ProductMapCanvas
                  centerNode={centerNode}
                  childNodes={childNodes}
                  isLoading={isGraphLoading}
                  onSelectChild={(node) => setFocusId(node.id)}
                  onSelectCenter={goBack}
                  canGoBack={canGoBack}
                  onAddChild={() => openCreateDialog(centerNode)}
                  onNodeContextMenu={handleNodeContextMenu}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="panoramic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col"
            >
              <ProductMapPanoramic
                nodes={allPanoramicNodes}
                isLoading={allNodesLoading}
                onNodeClick={handlePanoramicNodeClick}
              />
              {!allNodesLoading && allPanoramicNodes.length > 0 && (
                <p className="mt-2 text-center text-xs text-[#717B99]">
                  {allPanoramicNodes.length} nodos en el árbol
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {viewMode === "mindly" && contextMenu && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="Cerrar menú"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 min-w-[180px] rounded-xl border border-[#E5E5E5] bg-white py-1 shadow-lg"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            role="menu"
          >
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-[#FFF0F9]"
              onClick={() => openCreateDialog(contextMenu.node)}
            >
              Agregar hijo
            </button>
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-[#FFF0F9]"
              onClick={() => openEditDialog(contextMenu.node)}
            >
              Editar nodo
            </button>
            <hr className="my-1 border-[#F2F2F2]" />
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-red-50"
              onClick={() => openDeleteDialog(contextMenu.node)}
              disabled={contextMenu.node.id === root?.id}
            >
              Eliminar
            </button>
          </div>
        </>
      )}

      <NodeEditDialog
        open={editMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditMode(null);
            setEditTarget(null);
          }
        }}
        title={editMode === "create" ? "Nuevo nodo hijo" : "Editar nodo"}
        description={
          editMode === "create" && editTarget
            ? `Hijo de «${editTarget.name}»`
            : undefined
        }
        initialName={editMode === "create" ? "" : (editTarget?.name ?? "")}
        initialStatus={
          editMode === "create" ? "not_started" : (editTarget?.status ?? "not_started")
        }
        hasChildren={editMode === "edit" ? (editTarget?.children_count ?? 0) > 0 : false}
        submitLabel={editMode === "create" ? "Crear" : "Guardar"}
        isSubmitting={createNode.isPending || updateNode.isPending}
        onSubmit={(values) => void handleEditSubmit(values)}
      />

      <DeleteNodeDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        nodeName={deleteTarget?.name ?? ""}
        childCount={deleteChildNodes.length}
        isDeleting={deleteNode.isPending}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </div>
  );
};

export default AdminProductMap;
