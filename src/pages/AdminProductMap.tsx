import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CircleDot,
  Eye,
  GitBranch,
  Network,
  Plus,
  RotateCcw,
  Search,
  Share2,
} from "lucide-react";
import { getProductMapMutationErrorMessage } from "@/lib/product-map-mutation-errors";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsAdmin } from "@/lib/auth";
import {
  useCreateNode,
  useDeleteNode,
  useNodePath,
  useNodesByParent,
  useProductMapNode,
  useRootNode,
  useUpdateNode,
} from "@/hooks/useProductMap";
import { useAllProductMapNodes } from "@/hooks/useAllProductMapNodes";
import {
  getCenterNodeAccentColor,
  isVisuallyUntracked,
} from "@/lib/product-map-status";
import { ProductMapCanvas } from "@/components/product-map/ProductMapCanvas";
import { ProductMapSearch } from "@/components/product-map/ProductMapSearch";
import { ProductMapGraph } from "@/components/product-map/ProductMapGraph";
import { NodeDetailSheet } from "@/components/product-map/NodeDetailSheet";
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

export type ProductMapPageMode = "public" | "admin";

type AdminProductMapProps = {
  mode?: ProductMapPageMode;
};

const AdminProductMap = ({ mode = "admin" }: AdminProductMapProps) => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const canEdit = mode === "admin" && isAdmin;
  const isPublicMode = mode === "public";
  const { data: root, isLoading: rootLoading, error: rootError } = useRootNode();
  const [viewMode, setViewMode] = useState<ProductMapViewMode>(() => getStoredProductMapViewMode());
  const [focusId, setFocusId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [editTarget, setEditTarget] = useState<ProductMapNodeWithProgress | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductMapNodeWithProgress | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [detailNodeId, setDetailNodeId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

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

  useEffect(() => {
    if (mode === "admin" && !adminLoading && !isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [mode, adminLoading, isAdmin, navigate]);

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return;
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      e.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleViewModeChange = useCallback((mode: ProductMapViewMode) => {
    setViewMode(mode);
    setStoredProductMapViewMode(mode);
    setContextMenu(null);
  }, []);

  const handleOpenNodeDetail = useCallback((nodeId: string) => {
    setDetailNodeId(nodeId);
    setContextMenu(null);
  }, []);

  const handlePanoramicNodeClick = useCallback((node: ProductMapNodeWithProgress) => {
    setDetailNodeId(node.id);
  }, []);

  const handlePanoramicNodeDoubleClick = useCallback(
    (node: ProductMapNodeWithProgress) => {
      setFocusId(node.id);
      handleViewModeChange("mindly");
    },
    [handleViewModeChange],
  );

  const handleSearchSelectNode = useCallback(
    (nodeId: string) => {
      setSearchOpen(false);
      handleViewModeChange("mindly");
      setFocusId(nodeId);
      setDetailNodeId(nodeId);
      setContextMenu(null);
    },
    [handleViewModeChange],
  );

  const handleMindlyNodeDoubleClick = useCallback((nodeId: string) => {
    setDetailNodeId(nodeId);
  }, []);

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform);

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
    if (!canEdit) return;
    event.preventDefault();
    setContextMenu({ node, x: event.clientX, y: event.clientY });
  };

  const handleSharePublicLink = useCallback(async () => {
    const url = `${window.location.origin}/mapa`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado: fiestabirthday.com/mapa");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }, []);

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
        await updateNode.mutateAsync({
          id: editTarget.id,
          parent_id: editTarget.parent_id,
          name: values.name,
          status: values.status,
        });
        toast.success("Nodo actualizado");
      }
      setEditMode(null);
      setEditTarget(null);
    } catch (error) {
      toast.error(getProductMapMutationErrorMessage(error));
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
    } catch (error) {
      toast.error(getProductMapMutationErrorMessage(error));
    }
  };

  const isPageLoading = (mode === "admin" && adminLoading) || rootLoading || !centerNode;
  const isGraphLoading = centerLoading || childrenLoading;

  const isAtRoot = Boolean(root?.id && centerId === root.id);
  const centerProgress = centerNode?.calculated_progress ?? null;
  const progressBarValue = centerProgress ?? 0;
  const progressBarColor = centerNode
    ? getCenterNodeAccentColor(centerNode)
    : "#9CA3AF";
  const progressLabel = (() => {
    if (!centerNode) return "Mapa";
    if (isVisuallyUntracked(centerProgress) || centerNode.status === "untracked") {
      return `${centerNode.name} · Sin tracking`;
    }
    if (isAtRoot) {
      return `${centerNode.name} · Avance global: ${centerProgress}%`;
    }
    return `${centerNode.name} · ${centerProgress}%`;
  })();
  const pathLine =
    path.length > 0 ? path.map((n) => n.name).join(" › ") : null;

  const trackedNodeCount = allPanoramicNodes.filter((n) => n.status !== "untracked").length;
  const rootProgress = root?.calculated_progress ?? null;
  const rootBarColor = root ? getCenterNodeAccentColor(root) : "#9CA3AF";
  const isDetailOpen = detailNodeId !== null;

  if (mode === "admin" && !adminLoading && !isAdmin) {
    return null;
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: PRODUCT_MAP_BG, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <header className="sticky top-0 z-40 border-b border-[#F2F2F2] bg-white/95 backdrop-blur-sm">
        <div
          className={`mx-auto w-full px-4 py-3 ${viewMode === "panoramic" || viewMode === "graph" ? "max-w-[1600px]" : "max-w-5xl"}`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {!isPublicMode && (
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
              )}
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={viewMode}
                onValueChange={(value) => {
                  if (value === "mindly" || value === "panoramic" || value === "graph") {
                    handleViewModeChange(value);
                  }
                }}
                className="shrink-0 rounded-xl border border-[#E5E5E5] bg-white p-0.5"
                aria-label="Modo de vista del mapa"
              >
                <ToggleGroupItem
                  value="mindly"
                  className="rounded-lg px-3 data-[state=on]:bg-[#FFF0F9] data-[state=on]:text-[#C6017F]"
                  aria-label="Vista Mindly"
                >
                  <CircleDot className="mr-1.5 h-4 w-4" />
                  Mindly
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="panoramic"
                  className="rounded-lg px-3 data-[state=on]:bg-[#FFF0F9] data-[state=on]:text-[#C6017F]"
                  aria-label="Vista Panorámica"
                >
                  <GitBranch className="mr-1.5 h-4 w-4" />
                  Panorámica
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="graph"
                  className="rounded-lg px-3 data-[state=on]:bg-[#FFF0F9] data-[state=on]:text-[#C6017F]"
                  aria-label="Vista Grafo"
                >
                  <Network className="mr-1.5 h-4 w-4" />
                  Grafo
                </ToggleGroupItem>
              </ToggleGroup>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 rounded-xl text-[#717B99] hover:bg-[#FFF0F9] hover:text-[#C6017F]"
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar nodos"
              >
                <Search className="mr-1.5 h-4 w-4" />
                Buscar
                <kbd className="ml-1.5 hidden rounded border border-[#E5E5E5] bg-[#FAF8F5] px-1.5 py-0.5 font-sans text-[10px] font-medium text-[#717B99] sm:inline">
                  {isMac ? "⌘K" : "Ctrl+K"}
                </kbd>
              </Button>
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-[#E5E5E5] text-[#2E2D2C] hover:bg-[#FFF0F9]"
                  onClick={resetToRoot}
                  disabled={!root || centerId === root.id}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Reset
                </Button>
                {canEdit && (
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
                )}
                {mode === "admin" && canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-[#E5E5E5] text-[#2E2D2C] hover:bg-[#FFF0F9]"
                    onClick={() => void handleSharePublicLink()}
                  >
                    <Share2 className="mr-1.5 h-4 w-4" />
                    Compartir
                  </Button>
                )}
              </div>
            )}
            {mode === "admin" && canEdit && viewMode !== "mindly" && (
              <div className="flex shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-[#E5E5E5] text-[#2E2D2C] hover:bg-[#FFF0F9]"
                  onClick={() => void handleSharePublicLink()}
                >
                  <Share2 className="mr-1.5 h-4 w-4" />
                  Compartir
                </Button>
              </div>
            )}
          </div>

          <div className="mt-3 rounded-xl border border-[#F2F2F2] bg-[#FAF8F5] px-4 py-3">
            {viewMode === "graph" ? (
              allNodesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#2E2D2C]">
                    Grafo · {allPanoramicNodes.length} nodos · {trackedNodeCount} con tracking
                  </p>
                  {root && (
                    <>
                      <p className="mt-1 text-xs text-[#717B99]">
                        {root.name}
                        {rootProgress !== null
                          ? ` · Avance global: ${rootProgress}%`
                          : " · Sin tracking global"}
                      </p>
                      {rootProgress !== null && (
                        <Progress
                          value={rootProgress}
                          className="mt-2 h-2.5 bg-[#E5E5E5] [&>div]:bg-[var(--bar-color)] [&>div]:transition-all"
                          style={{ "--bar-color": rootBarColor } as React.CSSProperties}
                        />
                      )}
                    </>
                  )}
                </>
              )
            ) : isPageLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <>
                <p className="text-sm font-semibold text-[#2E2D2C]">{progressLabel}</p>
                <Progress
                  value={progressBarValue}
                  className="mt-2 h-2.5 bg-[#E5E5E5] [&>div]:bg-[var(--bar-color)] [&>div]:transition-all"
                  style={{ "--bar-color": progressBarColor } as React.CSSProperties}
                />
                {pathLine && (
                  <p className="mt-2 text-xs text-[#717B99]">{pathLine}</p>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {isPublicMode && (
        <div className="border-b border-[#F2F2F2] bg-[#FFF9F0] px-4 py-2">
          <div
            className={`mx-auto flex items-center gap-2 text-xs text-[#717B99] ${
              viewMode === "panoramic" || viewMode === "graph" ? "max-w-[1600px]" : "max-w-5xl"
            }`}
          >
            <Eye className="h-3.5 w-3.5 shrink-0 text-[#C6017F]" aria-hidden />
            <p>
              Estás viendo el mapa de producto de Fiestamas en modo lectura. Para editar, inicia
              sesión como admin.
            </p>
          </div>
        </div>
      )}

      <main
        className={`mx-auto flex min-h-0 w-full flex-1 flex-col px-2 py-4 sm:px-4 ${
          viewMode === "panoramic" || viewMode === "graph" ? "max-w-[1600px]" : "max-w-5xl"
        }`}
      >
        <AnimatePresence mode="wait">
          {viewMode === "mindly" && (
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
                  onNodeDoubleClick={handleMindlyNodeDoubleClick}
                  canEdit={canEdit}
                />
              )}
            </motion.div>
          )}
          {viewMode === "panoramic" && (
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
                onNodeDoubleClick={handlePanoramicNodeDoubleClick}
              />
              {!allNodesLoading && allPanoramicNodes.length > 0 && (
                <p className="mt-2 text-center text-xs text-[#717B99]">
                  {allPanoramicNodes.length} nodos en el árbol · Click para detalles · Doble click
                  para vista Foco
                </p>
              )}
            </motion.div>
          )}
          {viewMode === "graph" && (
            <motion.div
              key="graph"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col"
            >
              <ProductMapGraph
                nodes={allPanoramicNodes}
                isLoading={allNodesLoading}
                onNodeClick={(node) => setDetailNodeId(node.id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {viewMode === "mindly" && canEdit && contextMenu && (
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
              onClick={() => handleOpenNodeDetail(contextMenu.node.id)}
            >
              Ver detalles
            </button>
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

      <NodeDetailSheet
        open={isDetailOpen}
        nodeId={detailNodeId}
        onClose={() => setDetailNodeId(null)}
        allNodes={allPanoramicNodes}
        canEdit={canEdit}
        onEditNode={(node) => {
          setDetailNodeId(null);
          openEditDialog(node);
        }}
        onFocusInMindly={(nodeId) => {
          setFocusId(nodeId);
          setDetailNodeId(null);
          handleViewModeChange("mindly");
        }}
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

      <ProductMapSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectNode={handleSearchSelectNode}
      />
    </div>
  );
};

export default AdminProductMap;
