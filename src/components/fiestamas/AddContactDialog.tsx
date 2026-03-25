import { useState } from "react";
import { UserPlus, Search, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode = "search" | "manual";

interface FoundUser {
  id: string;
  name: string;
  initials: string;
  synced: boolean;
}

const mockFound: FoundUser[] = [
  { id: "f1", name: "Laura Martínez", initials: "LM", synced: false },
  { id: "f2", name: "Roberto García", initials: "RG", synced: false },
  { id: "f3", name: "Valentina Ruiz", initials: "VR", synced: true },
];

export function AddContactDialog({ open, onOpenChange }: Props) {
  const [mode, setMode] = useState<Mode>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [syncedIds, setSyncedIds] = useState<Set<string>>(
    new Set(mockFound.filter((u) => u.synced).map((u) => u.id))
  );
  const [manualForm, setManualForm] = useState({
    name: "",
    birthday: "",
    interests: "",
  });

  const filteredFound = searchQuery.length >= 2
    ? mockFound.filter((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSync = (id: string) => {
    setSyncedIds((prev) => new Set([...prev, id]));
  };

  const handleManualSave = () => {
    onOpenChange(false);
    setTimeout(() => {
      setManualForm({ name: "", birthday: "", interests: "" });
      setMode("search");
      setSearchQuery("");
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 tracking-display">
            <UserPlus className="h-5 w-5 text-primary" />
            Agregar contacto
          </DialogTitle>
          <DialogDescription>
            Busca en Fiestamas o agrega manualmente.
          </DialogDescription>
        </DialogHeader>

        {/* Toggle */}
        <div className="flex rounded-xl bg-secondary p-1">
          <button
            onClick={() => setMode("search")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              mode === "search"
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground"
            }`}
          >
            Buscar en Fiestamas
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              mode === "manual"
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground"
            }`}
          >
            Agregar manual
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === "search" ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="space-y-3"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Nombre, teléfono o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              {searchQuery.length >= 2 && (
                <div className="space-y-1">
                  {filteredFound.length > 0 ? (
                    filteredFound.map((user) => {
                      const isSynced = syncedIds.has(user.id);
                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 rounded-lg p-3 bg-secondary/50"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {user.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">Usuario de Fiestamas</p>
                          </div>
                          {isSynced ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-primary">
                              <Check className="h-3.5 w-3.5" />
                              Sincronizado
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleSync(user.id)}
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              Sincronizar
                            </Button>
                          )}
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl bg-secondary/50 p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        No encontramos a &ldquo;{searchQuery}&rdquo; en Fiestamas
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setMode("manual");
                          setManualForm((prev) => ({ ...prev, name: searchQuery }));
                        }}
                      >
                        Agregar manualmente
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {searchQuery.length < 2 && (
                <div className="rounded-xl bg-accent/5 p-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Cuando alguien ya está en Fiestamas, al sincronizar obtienes su fecha de
                    cumpleaños automáticamente y recibes notificaciones.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Nombre</label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={manualForm.name}
                  onChange={(e) => setManualForm((p) => ({ ...p, name: e.target.value }))}
                  className="h-10 w-full rounded-lg bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Fecha de cumpleaños
                </label>
                <input
                  type="date"
                  value={manualForm.birthday}
                  onChange={(e) => setManualForm((p) => ({ ...p, birthday: e.target.value }))}
                  className="h-10 w-full rounded-lg bg-secondary px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Intereses (separados por coma)
                </label>
                <input
                  type="text"
                  placeholder="Música, deportes, cocina..."
                  value={manualForm.interests}
                  onChange={(e) => setManualForm((p) => ({ ...p, interests: e.target.value }))}
                  className="h-10 w-full rounded-lg bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={!manualForm.name || !manualForm.birthday}
                onClick={handleManualSave}
              >
                Guardar contacto
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
