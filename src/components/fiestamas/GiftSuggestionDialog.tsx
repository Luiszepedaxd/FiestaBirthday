import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, ExternalLink, Heart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Contact } from "@/lib/mock-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
}

interface GiftIdea {
  name: string;
  price: string;
  reason: string;
  category: string;
}

function generateGifts(contact: Contact): GiftIdea[] {
  const base: GiftIdea[] = [
    {
      name: "Experiencia gastronómica",
      price: "$350 - $800",
      reason: `Perfecto para alguien que disfruta ${contact.interests[0]?.toLowerCase() || "experiencias únicas"}`,
      category: "Experiencia",
    },
    {
      name: "Kit personalizado",
      price: "$200 - $500",
      reason: `Curado según su interés en ${contact.interests[1]?.toLowerCase() || "cosas especiales"}`,
      category: "Regalo físico",
    },
    {
      name: "Suscripción mensual",
      price: "$150/mes",
      reason: "Un regalo que sigue dando cada mes",
      category: "Suscripción",
    },
    {
      name: "Clase o taller",
      price: "$400 - $1,200",
      reason: `Relacionado con ${contact.interests[2]?.toLowerCase() || "algo que le apasiona"}`,
      category: "Experiencia",
    },
  ];
  return base;
}

export function GiftSuggestionDialog({ open, onOpenChange, contact }: Props) {
  const [gifts] = useState(() => generateGifts(contact));
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const toggleFav = (i: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const firstName = contact.name.split(" ")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 tracking-display">
            <Gift className="h-5 w-5 text-primary" />
            Regalos para {firstName}
          </DialogTitle>
          <DialogDescription>
            Sugerencias basadas en sus intereses: {contact.interests.join(", ")}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {gifts.map((gift, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group flex items-start gap-3 rounded-xl bg-secondary p-3 transition-colors hover:bg-secondary/80"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{gift.name}</p>
                  <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                    {gift.category}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{gift.reason}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-primary">{gift.price}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => toggleFav(i)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-background"
                >
                  <Heart
                    className={`h-4 w-4 transition-colors ${
                      favorites.has(i) ? "fill-primary text-primary" : "text-muted-foreground"
                    }`}
                  />
                </button>
                <button className="rounded-lg p-1.5 transition-colors hover:bg-background">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <Button variant="outline" className="w-full gap-2">
          <RefreshCw className="h-4 w-4" />
          Generar más ideas
        </Button>
      </DialogContent>
    </Dialog>
  );
}
