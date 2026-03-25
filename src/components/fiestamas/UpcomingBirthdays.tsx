import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Contact } from "@/lib/mock-data";

interface Props {
  contacts: Contact[];
}

export function UpcomingBirthdays({ contacts }: Props) {
  const sendWhatsApp = (contact: Contact) => {
    const msg = `Feliz cumpleaños ${contact.name.split(" ")[0]}! Que la pases increíble.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold tracking-display text-foreground">Próximos 7 días</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {contacts.map((contact, i) => (
          <motion.div
            key={contact.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="rounded-xl border border-border bg-card p-4 flex items-center gap-4"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {contact.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{contact.name}</p>
              <p className="text-sm tabular-nums text-muted-foreground">{contact.birthdayFull}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => sendWhatsApp(contact)}
              title="Felicitar por WhatsApp"
            >
              <Send className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
