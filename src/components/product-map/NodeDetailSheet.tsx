import { useCallback, useMemo, useRef, useState } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { JSONContent } from "@tiptap/react";
import { CalendarIcon, ExternalLink, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AddClickUpLinkDialog } from "@/components/product-map/AddClickUpLinkDialog";
import { EditClickUpLinkDialog } from "@/components/product-map/EditClickUpLinkDialog";
import { NodeNotesEditor } from "@/components/product-map/NodeNotesEditor";
import {
  useClickUpLinks,
  useDeleteClickUpLink,
} from "@/hooks/useProductMapClickup";
import {
  useNodePath,
  useProductMapNode,
  useUpdateNodeNotes,
  useUpdateNodeTargetDate,
} from "@/hooks/useProductMap";
import {
  CLICKUP_BRAND_COLOR,
  formatTaskDisplayName,
} from "@/lib/clickup-utils";
import {
  getCenterNodeAccentColor,
  getStatusLabel,
  isVisuallyUntracked,
} from "@/lib/product-map-status";
import {
  formatDaysUntil,
  formatTargetDateLabel,
  TIME_HEALTH_CONFIG,
} from "@/lib/time-health";
import type { ClickUpLink, ProductMapNodeWithProgress } from "@/types/product-map";

export type NodeDetailSheetProps = {
  open: boolean;
  nodeId: string | null;
  onClose: () => void;
  allNodes: ProductMapNodeWithProgress[];
  onEditNode: (node: ProductMapNodeWithProgress) => void;
  onFocusInMindly: (nodeId: string) => void;
  canEdit?: boolean;
};

export function NodeDetailSheet({
  open,
  nodeId,
  onClose,
  allNodes,
  onEditNode,
  onFocusInMindly,
  canEdit = false,
}: NodeDetailSheetProps) {
  const { data: node, isLoading, isError } = useProductMapNode(open ? nodeId : null);
  const { data: path = [], isLoading: pathLoading } = useNodePath(open ? nodeId : null);
  const updateNotes = useUpdateNodeNotes();
  const updateTargetDate = useUpdateNodeTargetDate();
  const { data: clickUpLinks = [], isLoading: clickUpLinksLoading } = useClickUpLinks(
    open ? nodeId : null,
  );
  const deleteClickUpLink = useDeleteClickUpLink();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [addClickUpOpen, setAddClickUpOpen] = useState(false);
  const [editClickUpLink, setEditClickUpLink] = useState<ClickUpLink | null>(null);
  const clickUpSectionRef = useRef<HTMLElement>(null);

  const directChildrenCount = useMemo(() => {
    if (!nodeId) return 0;
    return allNodes.filter((n) => n.parent_id === nodeId).length;
  }, [allNodes, nodeId]);

  const breadcrumb = path.length > 0 ? path.map((n) => n.name).join(" › ") : null;
  const isLeaf = (node?.children_count ?? 0) === 0;
  const accentColor = node ? getCenterNodeAccentColor(node) : "#9CA3AF";
  const progressValue = node?.calculated_progress ?? 0;
  const showProgress =
    node && !isVisuallyUntracked(node.calculated_progress) && node.status !== "untracked";
  const timeHealth = node?.time_health ?? "no_target";
  const healthConfig = TIME_HEALTH_CONFIG[timeHealth];
  const HealthIcon = healthConfig.icon;
  const hasNotesContent = Boolean(node?.has_notes || node?.notes_plain_text?.trim());
  const clickUpCount = node?.clickup_links_count ?? clickUpLinks.length;
  const showClickUpSection =
    clickUpLinks.length > 0 || clickUpLinksLoading || (canEdit && Boolean(nodeId));
  const targetDateParsed = node?.target_date ? parseISO(node.target_date) : undefined;

  const createdLabel = node?.created_at
    ? format(new Date(node.created_at), "d MMM yyyy", { locale: es })
    : null;

  const notesUpdatedLabel = node?.notes_updated_at
    ? formatDistanceToNow(new Date(node.notes_updated_at), { addSuffix: true, locale: es })
    : null;

  const handleNotesChange = useCallback(
    (json: JSONContent, plainText: string) => {
      if (!nodeId || !canEdit) return;
      updateNotes.mutate({ nodeId, notes: json, notesPlainText: plainText });
    },
    [canEdit, nodeId, updateNotes],
  );

  const handleTargetDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!nodeId || !canEdit) return;
      const value = date ? format(date, "yyyy-MM-dd") : null;
      updateTargetDate.mutate({ nodeId, targetDate: value });
      setCalendarOpen(false);
    },
    [canEdit, nodeId, updateTargetDate],
  );

  const handleClearTargetDate = useCallback(() => {
    if (!nodeId || !canEdit) return;
    updateTargetDate.mutate({ nodeId, targetDate: null });
  }, [canEdit, nodeId, updateTargetDate]);

  const scrollToClickUpSection = useCallback(() => {
    clickUpSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleDeleteClickUpLink = useCallback(
    (link: ClickUpLink) => {
      if (!canEdit) return;
      const confirmed = window.confirm("¿Desligar esta task de ClickUp del nodo?");
      if (!confirmed) return;
      deleteClickUpLink.mutate(link);
    },
    [canEdit, deleteClickUpLink],
  );

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto sm:max-w-2xl"
      >
        {isLoading || pathLoading ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : isError || !node ? (
          <div className="pt-6 text-sm text-[#717B99]">No se pudo cargar el nodo.</div>
        ) : (
          <>
            {breadcrumb && (
              <p className="pt-2 text-xs text-[#717B99]">{breadcrumb}</p>
            )}

            <SheetHeader className="space-y-3 text-left">
              <div className="flex flex-wrap items-start gap-3">
                <SheetTitle className="text-2xl font-bold text-[#2E2D2C]">
                  {node.name}
                </SheetTitle>
                <Badge
                  className="shrink-0 border-transparent text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {getStatusLabel(node.status)}
                </Badge>
                {clickUpCount > 0 && (
                  <button
                    type="button"
                    onClick={scrollToClickUpSection}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#7B68EE]/30 bg-[#7B68EE]/10 px-2 py-0.5 text-xs font-medium text-[#7B68EE] transition-colors hover:bg-[#7B68EE]/20"
                    title={`${clickUpCount} task${clickUpCount === 1 ? "" : "s"} de ClickUp ligadas`}
                  >
                    <Link2 className="h-3 w-3" aria-hidden />
                    {clickUpCount} task{clickUpCount === 1 ? "" : "s"}
                  </button>
                )}
              </div>
            </SheetHeader>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#F2F2F2] bg-[#FAF8F5] px-3 py-3">
                <p className="text-xs font-medium text-[#717B99]">Progreso</p>
                {showProgress ? (
                  <>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-[#2E2D2C]">
                      {progressValue}%
                    </p>
                    <Progress
                      value={progressValue}
                      className="mt-2 h-1.5 bg-[#E5E5E5] [&>div]:bg-[var(--bar-color)]"
                      style={{ "--bar-color": accentColor } as React.CSSProperties}
                    />
                  </>
                ) : (
                  <p className="mt-1 text-sm text-[#717B99]">Sin tracking</p>
                )}
              </div>

              <div className="rounded-xl border border-[#F2F2F2] bg-[#FAF8F5] px-3 py-3">
                <p className="text-xs font-medium text-[#717B99]">Tipo</p>
                <p className="mt-1 text-sm font-semibold text-[#2E2D2C]">
                  {isLeaf
                    ? "Pantalla"
                    : `Módulo (${directChildrenCount} hijo${directChildrenCount === 1 ? "" : "s"})`}
                </p>
              </div>

              <div className="rounded-xl border border-[#F2F2F2] bg-[#FAF8F5] px-3 py-3">
                <p className="text-xs font-medium text-[#717B99]">Salud temporal</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <HealthIcon
                    className="h-4 w-4 shrink-0"
                    style={{ color: healthConfig.color }}
                    aria-hidden
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: healthConfig.color }}
                  >
                    {healthConfig.label}
                  </span>
                </div>
              </div>
            </div>

            <section className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-[#2E2D2C]">Fecha objetivo</h3>
              {node.target_date ? (
                <div className="space-y-2">
                  <p className="text-sm text-[#2E2D2C]">
                    Vence el {formatTargetDateLabel(node.target_date)} ·{" "}
                    <span className="text-[#717B99]">{formatDaysUntil(node.target_date)}</span>
                  </p>
                  {canEdit && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-[#E5E5E5]"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            Cambiar fecha
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={targetDateParsed}
                            onSelect={handleTargetDateSelect}
                            locale={es}
                            className="rounded-xl"
                          />
                        </PopoverContent>
                      </Popover>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-[#717B99] hover:text-destructive"
                        onClick={handleClearTargetDate}
                        disabled={updateTargetDate.isPending}
                      >
                        Quitar fecha
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-[#717B99]">Sin fecha objetivo</p>
                  {canEdit && (
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-[#E5E5E5]"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Agregar fecha
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={targetDateParsed}
                          onSelect={handleTargetDateSelect}
                          locale={es}
                          className="rounded-xl"
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}
            </section>

            {showClickUpSection && (
              <section ref={clickUpSectionRef} className="mt-6 space-y-3">
                {clickUpLinks.length > 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#2E2D2C]">
                      Tasks de ClickUp
                      <span className="ml-1.5 font-normal text-[#717B99]">
                        ({clickUpLinks.length})
                      </span>
                    </h3>
                  </div>
                )}

                {clickUpLinksLoading ? (
                  <Skeleton className="h-16 w-full rounded-xl" />
                ) : clickUpLinks.length > 0 ? (
                  <ul className="space-y-2">
                    {clickUpLinks.map((link) => (
                      <li
                        key={link.id}
                        className="group flex flex-wrap items-center gap-2 rounded-xl border border-[#F2F2F2] bg-[#FAF8F5] px-3 py-2"
                      >
                        <ExternalLink
                          className="h-4 w-4 shrink-0"
                          style={{ color: CLICKUP_BRAND_COLOR }}
                          aria-hidden
                        />
                        <a
                          href={link.clickup_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 flex-1 text-sm font-medium text-[#2E2D2C] underline-offset-2 hover:underline"
                          style={{ color: CLICKUP_BRAND_COLOR }}
                        >
                          {formatTaskDisplayName(link)}
                        </a>
                        {link.task_id && (
                          <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                            {link.task_id}
                          </Badge>
                        )}
                        {canEdit && (
                          <>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0 opacity-70 group-hover:opacity-100"
                              onClick={() => setEditClickUpLink(link)}
                              aria-label="Editar alias"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0 text-[#717B99] opacity-70 hover:text-destructive group-hover:opacity-100"
                              onClick={() => handleDeleteClickUpLink(link)}
                              disabled={deleteClickUpLink.isPending}
                              aria-label="Desligar task"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {canEdit && nodeId && (
                  <div className="space-y-1.5">
                    {clickUpLinks.length === 0 && (
                      <p className="text-xs text-[#717B99]">
                        Liga este nodo a tasks de ClickUp
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-[#7B68EE]/40 text-[#7B68EE] hover:bg-[#7B68EE]/10"
                      onClick={() => setAddClickUpOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar task de ClickUp
                    </Button>
                  </div>
                )}
              </section>
            )}

            {nodeId && (
              <>
                <AddClickUpLinkDialog
                  open={addClickUpOpen}
                  onOpenChange={setAddClickUpOpen}
                  nodeId={nodeId}
                />
                <EditClickUpLinkDialog
                  open={editClickUpLink !== null}
                  onOpenChange={(next) => !next && setEditClickUpLink(null)}
                  link={editClickUpLink}
                />
              </>
            )}

            <section className="mt-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#2E2D2C]">Notas</h3>
                {notesUpdatedLabel && (
                  <p className="text-xs text-[#717B99]">
                    Última edición: {notesUpdatedLabel}
                  </p>
                )}
              </div>

              {canEdit || hasNotesContent ? (
                <NodeNotesEditor
                  key={node.id}
                  content={node.notes}
                  onChange={handleNotesChange}
                  readOnly={!canEdit}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-[#FAF8F5] px-4 py-8 text-center text-sm text-[#717B99]">
                  Sin notas aún
                </div>
              )}
            </section>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => onEditNode(node)}
                >
                  Editar nombre y estado
                </Button>
              )}
              <Button
                type="button"
                className="flex-1 rounded-xl bg-[#C6017F] hover:bg-[#B10072]"
                onClick={() => onFocusInMindly(node.id)}
              >
                Ver en vista Foco
              </Button>
            </div>

            {createdLabel && (
              <SheetFooter className="mt-auto pt-6 sm:justify-start">
                <p className="text-xs text-[#717B99]">Creado el {createdLabel}</p>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
