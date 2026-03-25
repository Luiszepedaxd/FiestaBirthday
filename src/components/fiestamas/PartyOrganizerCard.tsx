import { motion } from "framer-motion";
import { PartyPopper, ArrowUpRight, Users, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Contact } from "@/lib/mock-data";

interface Props {
  contact: Contact;
}

export function PartyOrganizerCard({ contact }: Props) {
  const firstName = contact.name.split(" ")[0];

  const handleOrganize = () => {
    window.open("https://fiestamasfuturista.lovable.app/", "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
      className="rounded-2xl border border-border bg-card p-5 space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <PartyPopper className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold tracking-display text-foreground">
            Organiza la fiesta de {firstName}
          </h3>
          <p className="text-sm text-muted-foreground">
            Planifica todo desde un solo lugar con Fiestamas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: MapPin, label: "Salón", desc: "Encuentra el lugar" },
          { icon: Users, label: "Invitados", desc: "Gestiona la lista" },
          { icon: Calendar, label: "Agenda", desc: "Organiza el día" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-secondary p-3 text-center"
          >
            <item.icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-foreground">{item.label}</p>
            <p className="text-[10px] text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <Button
        size="lg"
        className="w-full gap-2 rounded-full"
        onClick={handleOrganize}
      >
        <PartyPopper className="h-4 w-4" />
        Organizar fiesta en Fiestamas
        <ArrowUpRight className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
