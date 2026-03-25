import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Crown, Check } from "lucide-react";

export interface Template {
  id: string;
  name: string;
  category: string;
  isPremium: boolean;
  gradient: string;
  accentColor: string;
}

const templates: Template[] = [
  { id: "classic", name: "Clásica", category: "Cumpleaños", isPremium: false, gradient: "from-rose-100 to-pink-50", accentColor: "text-rose-600" },
  { id: "minimal", name: "Minimal", category: "Reunión", isPremium: false, gradient: "from-slate-100 to-zinc-50", accentColor: "text-slate-700" },
  { id: "fiesta", name: "Fiesta", category: "Cumpleaños", isPremium: false, gradient: "from-amber-100 to-orange-50", accentColor: "text-amber-600" },
  { id: "elegante", name: "Elegante", category: "Boda", isPremium: true, gradient: "from-violet-100 to-purple-50", accentColor: "text-violet-600" },
  { id: "tropical", name: "Tropical", category: "Baby Shower", isPremium: true, gradient: "from-emerald-100 to-teal-50", accentColor: "text-emerald-600" },
  { id: "neon", name: "Neon Night", category: "Graduación", isPremium: true, gradient: "from-fuchsia-100 to-pink-50", accentColor: "text-fuchsia-600" },
];

interface Props {
  isPremiumUser: boolean;
  selectedTemplate: string | null;
  onSelect: (template: Template) => void;
}

export function InvitationTemplates({ isPremiumUser, selectedTemplate, onSelect }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">Elige un template</p>
        {isPremiumUser && (
          <span className="flex items-center gap-1 text-xs font-medium text-accent">
            <Crown className="h-3 w-3" /> Premium activo
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {templates.map((t) => {
          const locked = t.isPremium && !isPremiumUser;
          const selected = selectedTemplate === t.id;
          return (
            <button
              key={t.id}
              onClick={() => !locked && onSelect(t)}
              disabled={locked}
              className={`group relative overflow-hidden rounded-xl border-2 p-3 text-left transition-all ${
                selected
                  ? "border-primary bg-primary/5"
                  : locked
                  ? "border-transparent bg-secondary/50 opacity-60 cursor-not-allowed"
                  : "border-transparent bg-secondary hover:bg-secondary/80"
              }`}
            >
              {/* Mini preview */}
              <div className={`mb-2 h-14 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center`}>
                {locked ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : selected ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${t.accentColor}`}>
                    {t.category}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-foreground">{t.name}</p>
              <p className="text-[10px] text-muted-foreground">{t.category}</p>
              {t.isPremium && (
                <span className="absolute top-1.5 right-1.5">
                  <Crown className="h-3 w-3 text-accent" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { templates };
