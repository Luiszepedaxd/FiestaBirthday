import { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { Users, Check, AlertTriangle } from "lucide-react";
import { type SeatingGuest, type SeatingRelation } from "@/hooks/useSeating";

const GROUP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  familia:      { bg: "#FFF0F9", text: "#C6017F", border: "#F9C0E8" },
  trabajo:      { bg: "#F0F0FF", text: "#5221D6", border: "#C8C0F0" },
  amigos_novio: { bg: "#F0F9FF", text: "#0369A1", border: "#BAE6FD" },
  amigos_novia: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  hobby:        { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  pareja:       { bg: "#FDF4FF", text: "#A21CAF", border: "#E9D5FF" },
  otro:         { bg: "#F8F8F8", text: "#717B99", border: "#E5E5E5" },
};

function getTensionPairs(
  tableGuests: SeatingGuest[],
  relations: SeatingRelation[],
): { a: SeatingGuest; b: SeatingGuest; notes: string | null }[] {
  const pairs: { a: SeatingGuest; b: SeatingGuest; notes: string | null }[] = [];
  const ids = new Set(tableGuests.map(g => g.id));

  for (const rel of relations) {
    if (rel.relation_type !== "tension") continue;
    if (ids.has(rel.guest_a_id) && ids.has(rel.guest_b_id)) {
      const a = tableGuests.find(g => g.id === rel.guest_a_id);
      const b = tableGuests.find(g => g.id === rel.guest_b_id);
      if (a && b) pairs.push({ a, b, notes: rel.notes });
    }
  }
  return pairs;
}

function getTensionGuestIds(
  tableGroups: Record<number, SeatingGuest[]>,
  relations: SeatingRelation[],
): Set<string> {
  const ids = new Set<string>();
  for (const guests of Object.values(tableGroups)) {
    for (const pair of getTensionPairs(guests, relations)) {
      ids.add(pair.a.id);
      ids.add(pair.b.id);
    }
  }
  return ids;
}

function GuestChip({
  guest,
  isDragging = false,
  hasTension = false,
}: {
  guest: SeatingGuest;
  isDragging?: boolean;
  hasTension?: boolean;
}) {
  const colors = GROUP_COLORS[guest.group_tag ?? "otro"] ?? GROUP_COLORS["otro"]!;
  const initials = guest.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={`relative flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium select-none cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-90 shadow-lg scale-105" : "hover:shadow-sm"
      } ${hasTension ? "ring-2 ring-[#EF4444] ring-offset-1" : ""}`}
      style={{ backgroundColor: colors.bg, color: colors.text, borderColor: hasTension ? "#EF4444" : colors.border }}
    >
      {hasTension && (
        <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#EF4444] text-white text-[7px] font-bold">
          !
        </span>
      )}
      <div
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
        style={{ backgroundColor: colors.text }}
      >
        {initials}
      </div>
      <span className="max-w-[80px] truncate">{guest.name.split(" ")[0]}</span>
    </div>
  );
}

function DraggableGuest({ guest, hasTension }: { guest: SeatingGuest; hasTension: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: guest.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? "opacity-30" : ""}>
      <GuestChip guest={guest} hasTension={hasTension} />
    </div>
  );
}

function TensionAlert({
  pairs,
}: {
  pairs: { a: SeatingGuest; b: SeatingGuest; notes: string | null }[];
}) {
  if (pairs.length === 0) return null;
  return (
    <div className="mt-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-2 flex flex-col gap-1">
      {pairs.map((pair, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <AlertTriangle className="h-3 w-3 text-[#EF4444] shrink-0 mt-0.5" />
          <p className="text-[10px] text-[#DC2626] leading-tight">
            <strong>{pair.a.name.split(" ")[0]}</strong> y{" "}
            <strong>{pair.b.name.split(" ")[0]}</strong> tienen tensión
            {pair.notes ? ` — ${pair.notes}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

function TableZone({
  tableNumber,
  guests,
  maxSeats,
  isOver,
  relations,
  tensionGuestIds,
}: {
  tableNumber: number;
  guests: SeatingGuest[];
  maxSeats: number;
  isOver: boolean;
  relations: SeatingRelation[];
  tensionGuestIds: Set<string>;
}) {
  const { setNodeRef } = useDroppable({ id: `table-${tableNumber}` });
  const isFull = guests.length >= maxSeats;
  const fillPct = Math.min((guests.length / maxSeats) * 100, 100);
  const tensionPairs = getTensionPairs(guests, relations);
  const hasTensionInTable = tensionPairs.length > 0;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 p-3 transition-all min-h-[120px] flex flex-col gap-2 ${
        isOver
          ? "border-[#C6017F] bg-[#FFF0F9] shadow-[0_0_0_3px_rgba(198,1,127,0.15)]"
          : hasTensionInTable
            ? "border-[#FECACA] bg-[#FFF8F8]"
            : isFull
              ? "border-[#E5E5E5] bg-[#FAFAFA]"
              : "border-dashed border-[#E5E5E5] bg-white hover:border-[#C6017F]/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#2E2D2C]">Mesa {tableNumber}</span>
          {hasTensionInTable && (
            <AlertTriangle className="h-3 w-3 text-[#EF4444]" />
          )}
        </div>
        <span className={`text-[10px] font-semibold ${isFull ? "text-[#717B99]" : "text-[#C6017F]"}`}>
          {guests.length}/{maxSeats}
        </span>
      </div>

      <div className="h-1 w-full rounded-full bg-[#F2F2F2]">
        <div
          className="h-1 rounded-full transition-all"
          style={{
            width: `${fillPct}%`,
            backgroundColor: hasTensionInTable ? "#EF4444" : isFull ? "#E5E5E5" : "#C6017F",
          }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {guests.map(guest => (
          <DraggableGuest
            key={guest.id}
            guest={guest}
            hasTension={tensionGuestIds.has(guest.id) && guests.some(g =>
              g.id !== guest.id && relations.some(r =>
                r.relation_type === "tension" &&
                ((r.guest_a_id === guest.id && r.guest_b_id === g.id) ||
                 (r.guest_b_id === guest.id && r.guest_a_id === g.id))
              )
            )}
          />
        ))}
        {guests.length === 0 && (
          <span className="text-[10px] text-[#A1A1A0] self-center">
            {isOver ? "Soltar aquí ✓" : "Arrastra invitados aquí"}
          </span>
        )}
      </div>

      <TensionAlert pairs={tensionPairs} />
    </div>
  );
}

function UnassignedZone({ guests, tensionGuestIds }: { guests: SeatingGuest[]; tensionGuestIds: Set<string> }) {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 p-3 transition-all ${
        isOver ? "border-[#5221D6] bg-[#F5F0FD]" : "border-[#E5E5E5] bg-white"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-3.5 w-3.5 text-[#717B99]" />
        <span className="text-[11px] font-bold text-[#2E2D2C]">Sin asignar ({guests.length})</span>
      </div>
      <div className="flex flex-wrap gap-1.5 min-h-[36px]">
        {guests.map(guest => (
          <DraggableGuest key={guest.id} guest={guest} hasTension={false} />
        ))}
        {guests.length === 0 && (
          <span className="text-[10px] text-[#A1A1A0]">Todos los invitados asignados ✓</span>
        )}
      </div>
    </div>
  );
}

type Props = {
  guests: SeatingGuest[];
  relations: SeatingRelation[];
  tablesCount: number;
  seatsPerTable: number;
  onMoveGuest: (guestId: string, tableNumber: number | null) => void;
  onSave: () => void;
  isSaving: boolean;
};

export function SeatingCanvas({
  guests,
  relations,
  tablesCount,
  seatsPerTable,
  onMoveGuest,
  onSave,
  isSaving,
}: Props) {
  const [activeGuest, setActiveGuest] = useState<SeatingGuest | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const tableGroups = useMemo(() => {
    const groups: Record<number, SeatingGuest[]> = {};
    for (let i = 1; i <= tablesCount; i++) groups[i] = [];
    for (const g of guests) {
      if (g.table_number !== null && g.table_number >= 1 && g.table_number <= tablesCount) {
        groups[g.table_number]?.push(g);
      }
    }
    return groups;
  }, [guests, tablesCount]);

  const unassigned = useMemo(() => guests.filter(g => g.table_number === null), [guests]);
  const assignedCount = guests.length - unassigned.length;

  const totalTensions = useMemo(() => {
    let count = 0;
    for (const tableGuests of Object.values(tableGroups)) {
      count += getTensionPairs(tableGuests, relations).length;
    }
    return count;
  }, [tableGroups, relations]);

  const tensionGuestIds = useMemo(
    () => getTensionGuestIds(tableGroups, relations),
    [tableGroups, relations],
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveGuest(guests.find(g => g.id === e.active.id) ?? null);
  };

  const handleDragOver = (e: DragOverEvent) => {
    setOverId(e.over?.id ? String(e.over.id) : null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveGuest(null);
    setOverId(null);
    if (!e.over) return;
    const guestId = String(e.active.id);
    const dest = String(e.over.id);
    if (dest === "unassigned") {
      onMoveGuest(guestId, null);
    } else if (dest.startsWith("table-")) {
      const tableNum = parseInt(dest.replace("table-", ""), 10);
      if (!isNaN(tableNum)) onMoveGuest(guestId, tableNum);
    }
  };

  const groupsPresent = [...new Set(guests.map(g => g.group_tag ?? "otro"))];

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4">

        {/* Stats bar */}
        <div className="flex items-center justify-between rounded-xl bg-white border border-[#F2F2F2] px-4 py-2.5">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-[#717B99] font-medium">Asignados</p>
              <p className="text-base font-bold text-[#2E2D2C]">{assignedCount}/{guests.length}</p>
            </div>
            <div className="w-px h-8 bg-[#F2F2F2]" />
            <div>
              <p className="text-[10px] text-[#717B99] font-medium">Mesas</p>
              <p className="text-base font-bold text-[#2E2D2C]">{tablesCount}</p>
            </div>
            <div className="w-px h-8 bg-[#F2F2F2]" />
            <div>
              <p className="text-[10px] text-[#717B99] font-medium">Cap./mesa</p>
              <p className="text-base font-bold text-[#2E2D2C]">{seatsPerTable}</p>
            </div>
            {totalTensions > 0 && (
              <>
                <div className="w-px h-8 bg-[#F2F2F2]" />
                <div>
                  <p className="text-[10px] text-[#EF4444] font-medium">Conflictos</p>
                  <p className="text-base font-bold text-[#EF4444]">{totalTensions}</p>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-full bg-[#C6017F] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50 hover:bg-[#B10072] transition-colors"
          >
            {isSaving ? (
              <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Guardar
          </button>
        </div>

        {/* Banner de conflictos activos */}
        {totalTensions > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-[#EF4444] shrink-0" />
            <p className="text-[12px] text-[#DC2626] font-medium">
              {totalTensions === 1
                ? "Hay 1 conflicto activo — arrastra a los invitados para separar"
                : `Hay ${totalTensions} conflictos activos — arrastra a los invitados para separar`}
            </p>
          </div>
        )}

        {/* Legend */}
        {groupsPresent.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {groupsPresent.map(group => {
              const colors = GROUP_COLORS[group] ?? GROUP_COLORS["otro"]!;
              const count = guests.filter(g => (g.group_tag ?? "otro") === group).length;
              return (
                <span
                  key={group}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                  style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                >
                  {group} ({count})
                </span>
              );
            })}
          </div>
        )}

        {/* Unassigned */}
        {unassigned.length > 0 && (
          <UnassignedZone guests={unassigned} tensionGuestIds={tensionGuestIds} />
        )}

        {/* Tables grid */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: tablesCount }, (_, i) => i + 1).map(tableNum => (
            <TableZone
              key={tableNum}
              tableNumber={tableNum}
              guests={tableGroups[tableNum] ?? []}
              maxSeats={seatsPerTable}
              isOver={overId === `table-${tableNum}`}
              relations={relations}
              tensionGuestIds={tensionGuestIds}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeGuest && (
          <GuestChip
            guest={activeGuest}
            isDragging
            hasTension={tensionGuestIds.has(activeGuest.id)}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
