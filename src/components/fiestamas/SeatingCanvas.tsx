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
import { Users, Check } from "lucide-react";
import { type SeatingGuest } from "@/hooks/useSeating";

const GROUP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  familia: { bg: "#FFF0F9", text: "#C6017F", border: "#F9C0E8" },
  trabajo: { bg: "#F0F0FF", text: "#5221D6", border: "#C8C0F0" },
  amigos_novio: { bg: "#F0F9FF", text: "#0369A1", border: "#BAE6FD" },
  amigos_novia: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  hobby: { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  pareja: { bg: "#FDF4FF", text: "#A21CAF", border: "#E9D5FF" },
  otro: { bg: "#F8F8F8", text: "#717B99", border: "#E5E5E5" },
};

function GuestChip({ guest, isDragging = false }: { guest: SeatingGuest; isDragging?: boolean }) {
  const colors = GROUP_COLORS[guest.group_tag ?? "otro"] ?? GROUP_COLORS["otro"]!;
  const initials = guest.name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("");

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium select-none cursor-grab active:cursor-grabbing transition-all ${isDragging ? "opacity-90 shadow-lg scale-105" : "hover:shadow-sm"}`}
      style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
    >
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

function DraggableGuest({ guest }: { guest: SeatingGuest }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: guest.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? "opacity-30" : ""}>
      <GuestChip guest={guest} />
    </div>
  );
}

function TableZone({
  tableNumber,
  guests,
  maxSeats,
  isOver,
}: {
  tableNumber: number;
  guests: SeatingGuest[];
  maxSeats: number;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: `table-${tableNumber}` });
  const isFull = guests.length >= maxSeats;
  const fillPct = Math.min((guests.length / maxSeats) * 100, 100);

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 p-3 transition-all min-h-[120px] flex flex-col gap-2 ${
        isOver
          ? "border-[#C6017F] bg-[#FFF0F9] shadow-[0_0_0_3px_rgba(198,1,127,0.15)]"
          : isFull
            ? "border-[#E5E5E5] bg-[#FAFAFA]"
            : "border-dashed border-[#E5E5E5] bg-white hover:border-[#C6017F]/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#2E2D2C]">Mesa {tableNumber}</span>
        <span className={`text-[10px] font-semibold ${isFull ? "text-[#717B99]" : "text-[#C6017F]"}`}>
          {guests.length}/{maxSeats}
        </span>
      </div>

      <div className="h-1 w-full rounded-full bg-[#F2F2F2]">
        <div
          className="h-1 rounded-full transition-all"
          style={{ width: `${fillPct}%`, backgroundColor: isFull ? "#E5E5E5" : "#C6017F" }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {guests.map(guest => (
          <DraggableGuest key={guest.id} guest={guest} />
        ))}
        {guests.length === 0 && (
          <span className="text-[10px] text-[#A1A1A0] self-center">
            {isOver ? "Soltar aquí ✓" : "Arrastra invitados aquí"}
          </span>
        )}
      </div>
    </div>
  );
}

function UnassignedZone({ guests }: { guests: SeatingGuest[] }) {
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
          <DraggableGuest key={guest.id} guest={guest} />
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
  tablesCount: number;
  seatsPerTable: number;
  onMoveGuest: (guestId: string, tableNumber: number | null) => void;
  onSave: () => void;
  isSaving: boolean;
};

export function SeatingCanvas({ guests, tablesCount, seatsPerTable, onMoveGuest, onSave, isSaving }: Props) {
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

  const handleDragStart = (e: DragStartEvent) => {
    const guest = guests.find(g => g.id === e.active.id);
    setActiveGuest(guest ?? null);
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
              <p className="text-[10px] text-[#717B99] font-medium">Cap. por mesa</p>
              <p className="text-base font-bold text-[#2E2D2C]">{seatsPerTable}</p>
            </div>
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
          <UnassignedZone guests={unassigned} />
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
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeGuest && <GuestChip guest={activeGuest} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
