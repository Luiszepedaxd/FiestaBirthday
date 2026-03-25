import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, Check, Link2, Loader2, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddContactDialog } from "./AddContactDialog";
import { contacts as allContacts } from "@/lib/mock-data";

type SyncState = "loading" | "syncing" | "ready";

export function ContactsList() {
  const [search, setSearch] = useState("");
  const [syncState, setSyncState] = useState<SyncState>("loading");
  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set());
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Simulate loading and auto-sync
  useEffect(() => {
    const t1 = setTimeout(() => {
      setSyncState("syncing");
    }, 800);

    const t2 = setTimeout(() => {
      // Auto-sync contacts that are "found" in Fiestamas
      const autoSynced = allContacts.filter((c) => c.isSynced).map((c) => c.id);
      setSyncedIds(new Set(autoSynced));
      setSyncState("ready");
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const filtered = allContacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSync = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      setSyncedIds((prev) => new Set([...prev, id]));
      setSyncingId(null);
    }, 1000);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar contactos o encontrar en Fiestamas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setAddOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Agregar
          </Button>
        </div>

        {/* Sync status banner */}
        <AnimatePresence>
          {syncState !== "ready" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-3">
                {syncState === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <p className="text-sm text-foreground">Cargando tus contactos...</p>
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Sincronizando con Fiestamas
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Buscando contactos que ya están en la app para obtener sus datos automáticamente
                      </p>
                    </div>
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contact list */}
        <div className="space-y-1">
          {syncState === "loading" ? (
            // Skeleton loading
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg p-3"
              >
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))
          ) : (
            filtered.map((contact, i) => {
              const isSynced = syncedIds.has(contact.id);
              const isSyncing = syncingId === contact.id;
              return (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-secondary/60"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {contact.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {contact.name}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      Cumple: {contact.birthdayFull}
                    </p>
                  </div>
                  {isSynced ? (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-1 text-xs font-medium text-primary"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Sincronizado
                    </motion.span>
                  ) : isSyncing ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Sincronizando
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleSync(contact.id)}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Sincronizar
                    </Button>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* Auto-sync explanation */}
        {syncState === "ready" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-secondary/50 p-3"
          >
            <p className="text-xs text-muted-foreground leading-relaxed">
              Los contactos marcados como{" "}
              <strong className="text-primary">Sincronizado</strong> ya están en
              Fiestamas. Su fecha de cumpleaños e intereses se actualizan automáticamente.
            </p>
          </motion.div>
        )}
      </div>

      <AddContactDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
