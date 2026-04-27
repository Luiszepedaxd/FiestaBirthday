import { useState } from "react";
import { Sparkles, ChevronLeft, MessageCircle, Layout, Plus } from "lucide-react";
import { SmartSeatingChat } from "./SmartSeatingChat";
import { SeatingCanvas } from "./SeatingCanvas";
import {
  useSeatingEvents,
  useSeatingGuests,
  useSeatingRelations,
  useCreateSeatingEvent,
  useUpsertGuests,
  useUpsertRelations,
  useUpdateGuestTable,
  type SeatingGuest,
  type SeatingRelation,
} from "@/hooks/useSeating";
import { supabase } from "@/lib/supabase";

type Step = "list" | "setup" | "chat" | "canvas";

type ExtractedGuest = {
  name: string;
  group_tag: string | null;
  age_approx: number | null;
  is_single: boolean | null;
  comes_with_partner: boolean;
  notes: string | null;
};

export function SmartSeating() {
  const [step, setStep] = useState<Step>("list");
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [setupForm, setSetupForm] = useState({ name: "", tables: "8", seats: "8" });

  const { data: events = [], isLoading: eventsLoading } = useSeatingEvents();
  const { data: guests = [] } = useSeatingGuests(activeEventId);
  const createEvent = useCreateSeatingEvent();
  const upsertGuests = useUpsertGuests();
  const updateGuestTable = useUpdateGuestTable();
  const { data: relations = [] } = useSeatingRelations(activeEventId);
  const upsertRelations = useUpsertRelations();

  const activeEvent = events.find(e => e.id === activeEventId);

  const handleCreateEvent = async () => {
    if (!setupForm.name.trim()) return;
    const event = await createEvent.mutateAsync({
      name: setupForm.name.trim(),
      tables_count: parseInt(setupForm.tables) || 8,
      seats_per_table: parseInt(setupForm.seats) || 8,
    });
    setActiveEventId(event.id);
    setStep("chat");
  };

  const handleGuestsExtracted = async (
    extracted: ExtractedGuest[],
    rawRelations: {
      guest_a: string;
      guest_b: string;
      type: string;
      strength: number;
      notes: string | null;
    }[],
  ) => {
    if (!activeEventId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const seatsPerTable = activeEvent?.seats_per_table ?? 8;
    const tablesCount = activeEvent?.tables_count ?? 8;

    const groupOrder = [
      "familia", "pareja", "amigos_novio", "amigos_novia",
      "trabajo", "hobby", "otro",
    ];

    const sorted = [...extracted].sort((a, b) => {
      const ai = groupOrder.indexOf(a.group_tag ?? "otro");
      const bi = groupOrder.indexOf(b.group_tag ?? "otro");
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    let tc = 1, sc = 0;
    const final = sorted.map(g => {
      if (tc > tablesCount) {
        return {
          ...g,
          event_id: activeEventId,
          user_id: user.id,
          table_number: null,
          seat_position: null,
        };
      }
      const tn = tc;
      sc++;
      if (sc >= seatsPerTable) { tc++; sc = 0; }
      return {
        ...g,
        event_id: activeEventId,
        user_id: user.id,
        table_number: tn,
        seat_position: sc,
      };
    });

    const savedGuests = await upsertGuests.mutateAsync({
      guests: final as Omit<SeatingGuest, "id" | "created_at">[],
      eventId: activeEventId,
    });

    if (rawRelations.length > 0 && savedGuests && savedGuests.length > 0) {
      const nameToId = new Map<string, string>();
      for (const g of savedGuests) {
        nameToId.set(g.name.toLowerCase(), g.id);
        const first = g.name.split(" ")[0]?.toLowerCase();
        if (first) nameToId.set(first, g.id);
      }

      const relationsToSave: Omit<SeatingRelation, "id">[] = [];
      for (const r of rawRelations) {
        const aId = nameToId.get(r.guest_a.toLowerCase())
          ?? nameToId.get(r.guest_a.split(" ")[0]?.toLowerCase() ?? "");
        const bId = nameToId.get(r.guest_b.toLowerCase())
          ?? nameToId.get(r.guest_b.split(" ")[0]?.toLowerCase() ?? "");
        if (!aId || !bId || aId === bId) continue;

        const validTypes = ["tension", "afinidad", "pareja", "familia", "compañeros"] as const;
        const relType = validTypes.includes(r.type as typeof validTypes[number])
          ? (r.type as typeof validTypes[number])
          : "tension";

        relationsToSave.push({
          event_id: activeEventId,
          guest_a_id: aId,
          guest_b_id: bId,
          relation_type: relType,
          strength: r.strength ?? 1,
          notes: r.notes ?? null,
        });
      }

      if (relationsToSave.length > 0) {
        await upsertRelations.mutateAsync({
          relations: relationsToSave,
          eventId: activeEventId,
        });
      }
    }
  };

  const handleMoveGuest = (guestId: string, tableNumber: number | null) => {
    if (!activeEventId) return;
    updateGuestTable.mutate({ guestId, tableNumber, eventId: activeEventId });
  };

  const handleSaveLayout = () => {
    // Layout auto-saves on every drag via updateGuestTable
  };

  // STEP: LIST
  if (step === "list") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#141413] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#C6017F]" />
              Smart Seating
            </h2>
            <p className="text-sm text-[#717B99]">Layout de mesas con IA</p>
          </div>
          <button
            type="button"
            onClick={() => setStep("setup")}
            className="flex items-center gap-1.5 rounded-full bg-[#C6017F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B10072] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo evento
          </button>
        </div>

        {eventsLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-16 rounded-2xl bg-[#F2F2F2] animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#F2F2F2] p-8 text-center">
            <span className="text-4xl">🪑</span>
            <p className="mt-3 font-semibold text-[#2E2D2C]">Sin eventos aún</p>
            <p className="mt-1 text-sm text-[#717B99]">Crea tu primer layout de mesas con IA</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map(event => (
              <button
                key={event.id}
                type="button"
                onClick={() => { setActiveEventId(event.id); setStep("canvas"); }}
                className="w-full rounded-2xl bg-white border border-[#F2F2F2] p-4 text-left hover:border-[#C6017F]/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#141413]">{event.name}</p>
                    <p className="text-xs text-[#717B99]">
                      {event.tables_count} mesas · {event.seats_per_table} lugares c/u
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActiveEventId(event.id); setStep("chat"); }}
                      className="rounded-full border border-[#5221D6] px-3 py-1 text-xs font-medium text-[#5221D6] hover:bg-[#5221D6]/5"
                    >
                      <MessageCircle className="h-3 w-3 inline mr-1" />
                      Chat IA
                    </button>
                    <span className="rounded-full border border-[#E5E5E5] px-3 py-1 text-xs font-medium text-[#717B99]">
                      <Layout className="h-3 w-3 inline mr-1" />
                      Ver mesas
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // STEP: SETUP
  if (step === "setup") {
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => setStep("list")} className="flex items-center gap-1 text-sm text-[#717B99] hover:text-[#2E2D2C]">
          <ChevronLeft className="h-4 w-4" /> Volver
        </button>
        <div>
          <h2 className="text-lg font-bold text-[#141413]">Nuevo evento</h2>
          <p className="text-sm text-[#717B99]">Configura los datos básicos antes de hablar con la IA</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-[#2E2D2C]">Nombre del evento</label>
            <input
              type="text"
              placeholder="ej: Boda de Ana y Carlos"
              value={setupForm.name}
              onChange={e => setSetupForm(p => ({ ...p, name: e.target.value }))}
              className="mt-1 h-12 w-full rounded-xl border border-[#E5E5E5] bg-white px-3 text-sm text-[#2E2D2C] focus:border-[#C6017F] focus:outline-none focus:ring-1 focus:ring-[#C6017F]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-[#2E2D2C]">Número de mesas</label>
              <input
                type="number"
                min="1"
                max="50"
                value={setupForm.tables}
                onChange={e => setSetupForm(p => ({ ...p, tables: e.target.value }))}
                className="mt-1 h-12 w-full rounded-xl border border-[#E5E5E5] bg-white px-3 text-sm text-[#2E2D2C] focus:border-[#C6017F] focus:outline-none focus:ring-1 focus:ring-[#C6017F]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#2E2D2C]">Lugares por mesa</label>
              <input
                type="number"
                min="1"
                max="20"
                value={setupForm.seats}
                onChange={e => setSetupForm(p => ({ ...p, seats: e.target.value }))}
                className="mt-1 h-12 w-full rounded-xl border border-[#E5E5E5] bg-white px-3 text-sm text-[#2E2D2C] focus:border-[#C6017F] focus:outline-none focus:ring-1 focus:ring-[#C6017F]"
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={!setupForm.name.trim() || createEvent.isPending}
          onClick={() => void handleCreateEvent()}
          className="h-12 w-full rounded-xl bg-[#C6017F] text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#B10072] transition-colors"
        >
          {createEvent.isPending ? "Creando..." : "Continuar con IA →"}
        </button>
      </div>
    );
  }

  // STEP: CHAT
  if (step === "chat" && activeEvent) {
    return (
      <div className="flex flex-col h-[calc(100vh-10rem)] min-h-[500px]">
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <button type="button" onClick={() => setStep("list")} className="flex items-center gap-1 text-sm text-[#717B99] hover:text-[#2E2D2C]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#141413] truncate">{activeEvent.name}</p>
            <p className="text-xs text-[#717B99]">Chat IA — Cuéntame sobre tus invitados</p>
          </div>
          <button
            type="button"
            onClick={() => setStep("canvas")}
            className="shrink-0 rounded-full border border-[#E5E5E5] px-3 py-1 text-xs font-medium text-[#717B99] hover:border-[#C6017F] hover:text-[#C6017F]"
          >
            Ver mesas →
          </button>
        </div>
        <div className="flex-1 min-h-0 rounded-2xl bg-white border border-[#F2F2F2] overflow-hidden">
          <SmartSeatingChat
            eventId={activeEvent.id}
            eventName={activeEvent.name}
            existingGuests={guests}
            onGuestsExtracted={(extracted, rawRelations) => void handleGuestsExtracted(extracted, rawRelations)}
            onChatComplete={() => setStep("canvas")}
          />
        </div>
      </div>
    );
  }

  // STEP: CANVAS
  if (step === "canvas" && activeEvent) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setStep("list")} className="flex items-center gap-1 text-sm text-[#717B99] hover:text-[#2E2D2C]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#141413] truncate">{activeEvent.name}</p>
            <p className="text-xs text-[#717B99]">{guests.length} invitados · Drag & drop para ajustar</p>
          </div>
          <button
            type="button"
            onClick={() => setStep("chat")}
            className="shrink-0 rounded-full border border-[#5221D6] px-3 py-1 text-xs font-medium text-[#5221D6] hover:bg-[#5221D6]/5"
          >
            <MessageCircle className="h-3 w-3 inline mr-1" />
            Chat IA
          </button>
        </div>
        <SeatingCanvas
          guests={guests}
          relations={relations}
          tablesCount={activeEvent.tables_count}
          seatsPerTable={activeEvent.seats_per_table}
          onMoveGuest={handleMoveGuest}
          onSave={handleSaveLayout}
          isSaving={updateGuestTable.isPending}
        />
      </div>
    );
  }

  return null;
}
