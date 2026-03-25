import { motion } from "framer-motion";
import { Sparkles, MapPin, Gift, Clock } from "lucide-react";
import type { Contact } from "@/lib/mock-data";

interface Props {
  contact: Contact;
}

const suggestions = [
  { icon: MapPin, text: "Reservar en su restaurante favorito", tag: "Experiencia" },
  { icon: Gift, text: "Enviar flores a domicilio vía partner", tag: "Regalo" },
  { icon: Clock, text: "Recordatorio: le regalaste flores el año pasado", tag: "Historial" },
];

export function SuggestionEngine({ contact }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Ideas para {contact.name.split(" ")[0]}</h3>
      </div>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.25 }}
            className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-secondary"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="flex-1 text-sm text-foreground">{s.text}</p>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              {s.tag}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
