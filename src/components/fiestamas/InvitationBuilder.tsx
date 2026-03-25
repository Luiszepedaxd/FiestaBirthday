import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Clock, Type, Send, Copy, QrCode, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvitationTemplates, templates, type Template } from "./InvitationTemplates";
import { GuestConfirmation } from "./GuestConfirmation";
import { PremiumUpgradeDialog } from "./PremiumUpgradeDialog";

const eventTypes = ["Cumpleaños", "Boda", "Graduación", "Baby Shower", "Reunión", "Otro"];

export function InvitationBuilder() {
  const [form, setForm] = useState({
    title: "",
    type: "Cumpleaños",
    date: "",
    time: "",
    location: "",
    description: "",
  });
  const [sent, setSent] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>("classic");
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showGuests, setShowGuests] = useState(false);

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSelectTemplate = (template: Template) => {
    if (template.isPremium && !isPremiumUser) {
      setShowUpgrade(true);
      return;
    }
    setSelectedTemplate(template.id);
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="space-y-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-display text-foreground">Nuevo Evento</h3>
            {isPremiumUser ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
                <Crown className="h-3.5 w-3.5" />
                Premium
              </span>
            ) : (
              <button
                onClick={() => setShowUpgrade(true)}
                className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Crown className="h-3.5 w-3.5" />
                Obtener Premium — $89/mes
              </button>
            )}
          </div>

          {/* Templates */}
          <InvitationTemplates
            isPremiumUser={isPremiumUser}
            selectedTemplate={selectedTemplate}
            onSelect={handleSelectTemplate}
          />

          {/* Event type pills */}
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((t) => (
              <button
                key={t}
                onClick={() => update("type", t)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  form.type === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <FieldInput
              icon={<Type className="h-4 w-4" />}
              placeholder="Nombre del evento"
              value={form.title}
              onChange={(v) => update("title", v)}
            />
            <FieldInput
              icon={<CalendarDays className="h-4 w-4" />}
              placeholder="Fecha"
              type="date"
              value={form.date}
              onChange={(v) => update("date", v)}
            />
            <FieldInput
              icon={<Clock className="h-4 w-4" />}
              placeholder="Hora"
              type="time"
              value={form.time}
              onChange={(v) => update("time", v)}
            />
            <FieldInput
              icon={<MapPin className="h-4 w-4" />}
              placeholder="Lugar"
              value={form.location}
              onChange={(v) => update("location", v)}
            />
            <textarea
              placeholder="Descripción o mensaje para tus invitados..."
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="w-full rounded-lg bg-secondary p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px] resize-none transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="hero"
              size="lg"
              className="gap-2"
              onClick={() => setSent(true)}
            >
              <Send className="h-4 w-4" />
              Generar invitación
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <QrCode className="h-4 w-4" />
              Código QR
            </Button>
            {isPremiumUser && (
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => setShowGuests(!showGuests)}
              >
                <Crown className="h-4 w-4 text-accent" />
                {showGuests ? "Ocultar invitados" : "Gestionar invitados"}
              </Button>
            )}
          </div>

          {/* Guest confirmation (premium) */}
          {isPremiumUser && showGuests && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-2xl bg-card shadow-card p-5"
            >
              <h4 className="mb-3 text-sm font-semibold tracking-display text-foreground flex items-center gap-2">
                <Crown className="h-4 w-4 text-accent" />
                Confirmación de Invitados
              </h4>
              <GuestConfirmation />
            </motion.div>
          )}
        </motion.div>

        {/* Live Preview */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex items-start justify-center"
        >
          <div
            className={`w-full max-w-[320px] overflow-hidden rounded-2xl shadow-elevated bg-gradient-to-br ${currentTemplate?.gradient || "from-white to-slate-50"}`}
            style={{ aspectRatio: "9/16" }}
          >
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              {/* Template badge */}
              {currentTemplate && (
                <p className="mb-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
                  Template: {currentTemplate.name}
                </p>
              )}

              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Te invito a
              </p>
              <h4 className={`mb-4 text-xl font-semibold tracking-display ${currentTemplate?.accentColor || "text-foreground"}`}>
                {form.title || `Mi ${form.type}`}
              </h4>

              {(form.date || form.time) && (
                <div className="mb-2 flex items-center gap-2 text-sm tabular-nums text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{form.date || "Fecha"}</span>
                  {form.time && <span>· {form.time}</span>}
                </div>
              )}

              {form.location && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{form.location}</span>
                </div>
              )}

              {form.description && (
                <p className="mb-6 text-sm text-muted-foreground text-pretty leading-relaxed">
                  {form.description}
                </p>
              )}

              <div className="mt-auto w-full space-y-2">
                <div className={`rounded-lg py-2.5 text-sm font-semibold ${
                  currentTemplate?.accentColor
                    ? `bg-current/10 ${currentTemplate.accentColor}`
                    : "bg-primary text-primary-foreground"
                }`} style={!currentTemplate?.accentColor ? {} : { backgroundColor: "currentColor", color: "white", WebkitTextFillColor: "white" }}>
                  Confirmar asistencia
                </div>
                {!isPremiumUser && (
                  <p className="text-[11px] text-muted-foreground">Powered by Fiestamas</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Success toast inline */}
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-full flex items-center gap-3 rounded-xl bg-primary/5 p-4"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Copy className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Invitación generada</p>
              <p className="text-xs text-muted-foreground">El enlace ha sido copiado al portapapeles.</p>
            </div>
          </motion.div>
        )}
      </div>

      <PremiumUpgradeDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        onUpgrade={() => setIsPremiumUser(true)}
      />
    </>
  );
}

function FieldInput({
  icon,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
      />
    </div>
  );
}
