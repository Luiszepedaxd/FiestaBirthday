import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music, Wand2, Play, Pause, Download, ArrowRight,
  Heart, Star, MessageSquare, User, Lightbulb,
} from "lucide-react";
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

type Step = "personalize" | "style" | "generating" | "preview";

const genres = [
  { id: "pop", label: "Pop Latino", desc: "Ritmo alegre y pegajoso" },
  { id: "rock", label: "Rock Clásico", desc: "Guitarras y energía" },
  { id: "cumbia", label: "Cumbia", desc: "Para bailar sin parar" },
  { id: "balada", label: "Balada", desc: "Emotiva y personal" },
  { id: "reggaeton", label: "Reggaetón", desc: "Ritmo urbano moderno" },
  { id: "ranchera", label: "Ranchera", desc: "Tradición mexicana" },
];

const toneOptions = [
  { id: "funny", label: "Divertida", icon: Lightbulb },
  { id: "emotional", label: "Emotiva", icon: Heart },
  { id: "epic", label: "Épica", icon: Star },
];

export function SongCreatorDialog({ open, onOpenChange, contact }: Props) {
  const [step, setStep] = useState<Step>("personalize");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Personalization fields
  const [nickname, setNickname] = useState("");
  const [relationship, setRelationship] = useState("");
  const [anecdote, setAnecdote] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("funny");

  const handleGenerate = () => {
    setStep("generating");
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 12;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setStep("preview"), 400);
      }
      setProgress(Math.min(p, 100));
    }, 350);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setTimeout(() => {
        setStep("personalize");
        setSelectedGenre(null);
        setProgress(0);
        setIsPlaying(false);
        setNickname("");
        setRelationship("");
        setAnecdote("");
        setKeywords("");
        setTone("funny");
      }, 200);
    }
    onOpenChange(val);
  };

  const firstName = contact.name.split(" ")[0];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 tracking-display">
            <Music className="h-5 w-5 text-primary" />
            Canción IA para {firstName}
          </DialogTitle>
          <DialogDescription>
            Personaliza la canción con detalles únicos de {firstName}.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-1">
          {(["personalize", "style", "generating", "preview"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  step === s ? "w-8 bg-primary" :
                  (["personalize", "style", "generating", "preview"].indexOf(step) > i ? "w-2 bg-primary/40" : "w-2 bg-secondary")
                }`}
              />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "personalize" && (
            <motion.div
              key="personalize"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div>
                <p className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Sobre {firstName}
                </p>
                <div className="space-y-2.5">
                  <input
                    placeholder={`Apodo o como le dices (ej: "Sofi", "La jefa")`}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="h-10 w-full rounded-lg bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  <input
                    placeholder="Tu relación (amiga, hermano, novio, colega...)"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="h-10 w-full rounded-lg bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  Anécdota o mensaje especial
                </p>
                <textarea
                  placeholder={`Algo memorable, un chiste interno, un recuerdo juntos...`}
                  value={anecdote}
                  onChange={(e) => setAnecdote(e.target.value)}
                  className="w-full rounded-lg bg-secondary p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 min-h-[70px] resize-none transition-all"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
                  Palabras o frases clave para la letra
                </p>
                <input
                  placeholder="ej: fiesta, bailar toda la noche, la mejor amiga..."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="h-10 w-full rounded-lg bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Tono de la canción</p>
                <div className="flex gap-2">
                  {toneOptions.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTone(t.id)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 p-2.5 text-sm font-medium transition-all ${
                          tone === t.id
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-transparent bg-secondary text-muted-foreground hover:bg-secondary/80"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interests auto-detected */}
              <div className="rounded-xl bg-accent/5 p-3">
                <p className="text-xs text-muted-foreground mb-1.5">
                  Intereses detectados de {firstName}:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {contact.interests.map((i) => (
                    <span
                      key={i}
                      className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                    >
                      {i}
                    </span>
                  ))}
                </div>
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={() => setStep("style")}
              >
                Siguiente: elegir estilo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === "style" && (
            <motion.div
              key="style"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Elige un estilo musical</p>
                <div className="grid grid-cols-2 gap-2">
                  {genres.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGenre(g.id)}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        selectedGenre === g.id
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">{g.label}</p>
                      <p className="text-xs text-muted-foreground">{g.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {(nickname || anecdote || keywords) && (
                <div className="rounded-xl bg-secondary p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resumen de personalización</p>
                  {nickname && <p className="text-xs text-foreground">Apodo: <strong>{nickname}</strong></p>}
                  {relationship && <p className="text-xs text-foreground">Relación: <strong>{relationship}</strong></p>}
                  {anecdote && <p className="text-xs text-foreground truncate">Anécdota: {anecdote}</p>}
                  {keywords && <p className="text-xs text-foreground">Palabras clave: <strong>{keywords}</strong></p>}
                  <p className="text-xs text-foreground">Tono: <strong>{toneOptions.find(t => t.id === tone)?.label}</strong></p>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
                <span className="text-sm text-foreground">Precio</span>
                <span className="text-lg font-semibold tabular-nums text-primary">$49 MXN</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep("personalize")}
                  className="gap-2"
                >
                  Atrás
                </Button>
                <Button
                  className="flex-1 gap-2"
                  size="lg"
                  disabled={!selectedGenre}
                  onClick={handleGenerate}
                >
                  <Wand2 className="h-4 w-4" />
                  Generar canción
                </Button>
              </div>
            </motion.div>
          )}

          {step === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Wand2 className="h-8 w-8 text-primary" />
              </motion.div>
              <div className="text-center">
                <p className="font-medium text-foreground">Componiendo la canción...</p>
                <p className="text-sm text-muted-foreground">
                  Mezclando {selectedGenre} con la esencia de {nickname || firstName}
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs tabular-nums text-muted-foreground">
                {Math.round(progress)}%
              </p>
            </motion.div>
          )}

          {step === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="rounded-xl bg-secondary p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Vista previa
                </p>
                <p className="text-sm font-medium text-foreground">
                  &ldquo;Feliz día, {nickname || firstName}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedGenre && genres.find((g) => g.id === selectedGenre)?.label} — 1:24 min
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 ml-0.5" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={isPlaying ? { width: "100%" } : {}}
                        transition={{ duration: 8, ease: "linear" }}
                      />
                    </div>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">1:24</span>
                </div>
              </div>

              <div className="rounded-xl bg-accent/5 p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Letra generada con referencias a{" "}
                  <strong className="text-foreground">{contact.interests.join(", ")}</strong>
                  {nickname && <>, usando el apodo <strong className="text-foreground">{nickname}</strong></>}
                  {anecdote && <> e inspirada en tu anécdota</>}.
                </p>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 gap-2" size="lg">
                  <Download className="h-4 w-4" />
                  Descargar — $49
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() =>
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(
                        `Te compuse una canción de cumpleaños con Fiestamas!`
                      )}`,
                      "_blank"
                    )
                  }
                >
                  Compartir
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
