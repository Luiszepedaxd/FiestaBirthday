import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, UserX, Clock, Plus, Send, Users,
  Check, X, HelpCircle, Trash2, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Guest {
  id: string;
  name: string;
  email: string;
  status: "pending" | "confirmed" | "declined";
}

const mockGuests: Guest[] = [
  { id: "1", name: "Sofía Hernández", email: "sofia@email.com", status: "confirmed" },
  { id: "2", name: "Carlos Méndez", email: "carlos@email.com", status: "confirmed" },
  { id: "3", name: "Ana Rodríguez", email: "ana@email.com", status: "pending" },
  { id: "4", name: "Diego López", email: "diego@email.com", status: "declined" },
  { id: "5", name: "María Torres", email: "maria@email.com", status: "pending" },
];

export function GuestConfirmation() {
  const [guests, setGuests] = useState<Guest[]>(mockGuests);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const confirmed = guests.filter((g) => g.status === "confirmed").length;
  const pending = guests.filter((g) => g.status === "pending").length;
  const declined = guests.filter((g) => g.status === "declined").length;

  const addGuest = () => {
    if (!newName.trim()) return;
    setGuests((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: newName.trim(),
        email: newEmail.trim(),
        status: "pending",
      },
    ]);
    setNewName("");
    setNewEmail("");
    setShowAdd(false);
  };

  const removeGuest = (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  const statusConfig = {
    confirmed: { icon: UserCheck, label: "Confirmado", color: "text-emerald-600 bg-emerald-50" },
    pending: { icon: Clock, label: "Pendiente", color: "text-amber-600 bg-amber-50" },
    declined: { icon: UserX, label: "Declinó", color: "text-red-500 bg-red-50" },
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Confirmados", count: confirmed, icon: UserCheck, color: "text-emerald-600" },
          { label: "Pendientes", count: pending, icon: Clock, color: "text-amber-600" },
          { label: "Declinaron", count: declined, icon: UserX, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-secondary p-3 text-center">
            <s.icon className={`mx-auto mb-1 h-4 w-4 ${s.color}`} />
            <p className="text-lg font-semibold tabular-nums text-foreground">{s.count}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Guest list */}
      <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
        <AnimatePresence>
          {guests.map((guest) => {
            const cfg = statusConfig[guest.status];
            const StatusIcon = cfg.icon;
            return (
              <motion.div
                key={guest.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                  {guest.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{guest.name}</p>
                  {guest.email && (
                    <p className="text-[11px] text-muted-foreground truncate">{guest.email}</p>
                  )}
                </div>
                <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${cfg.color}`}>
                  <StatusIcon className="h-3 w-3" />
                  {cfg.label}
                </span>
                <button
                  onClick={() => removeGuest(guest.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add guest */}
      <AnimatePresence>
        {showAdd ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 rounded-xl bg-secondary p-3"
          >
            <input
              placeholder="Nombre del invitado"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-9 w-full rounded-lg bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              placeholder="Email (opcional)"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="h-9 w-full rounded-lg bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addGuest} disabled={!newName.trim()} className="gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Agregar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowAdd(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar invitado
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const pendingGuests = guests.filter(g => g.status === "pending");
                if (pendingGuests.length > 0) {
                  const names = pendingGuests.map(g => g.name).join(", ");
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(`Hola! Te invito a mi evento. Confirma tu asistencia por favor.`)}`,
                    "_blank"
                  );
                }
              }}
            >
              <Send className="h-3.5 w-3.5" />
              Recordar pendientes
            </Button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
