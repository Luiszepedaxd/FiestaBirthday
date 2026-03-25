import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Film, Mic, Wand2, Sparkles, Play,
  Image, Type, Music, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import type { Contact } from "@/lib/mock-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
}

type VideoTab = "templates" | "custom" | "voice";

const templates = [
  { id: "kinetic", name: "Kinetic Text", description: "Texto animado con transiciones dinámicas y música", icon: Type, preview: "bg-gradient-to-br from-primary/20 to-accent/20", duration: "15s" },
  { id: "slideshow", name: "Slideshow con Fotos", description: "Presenta fotos con efectos de cámara cinematográficos", icon: Image, preview: "bg-gradient-to-br from-secondary to-muted", duration: "30s" },
  { id: "particles", name: "Celebración Mágica", description: "Partículas, confeti y efectos de luz festivos", icon: Sparkles, preview: "bg-gradient-to-br from-accent/20 to-primary/10", duration: "20s" },
  { id: "collage", name: "Collage Animado", description: "Múltiples fotos que se ensamblan con transiciones", icon: Layers, preview: "bg-gradient-to-br from-muted to-secondary", duration: "25s" },
];

const tabs: { key: VideoTab; label: string; icon: React.ElementType }[] = [
  { key: "templates", label: "Templates", icon: Film },
  { key: "custom", label: "Animación IA", icon: Wand2 },
  { key: "voice", label: "Audio de Voz", icon: Mic },
];

export function VideoCreatorDialog({ open, onOpenChange, contact }: Props) {
  const [activeTab, setActiveTab] = useState<VideoTab>("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [voiceMessage, setVoiceMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const firstName = contact.name.split(" ")[0];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 3000);
  };

  const toggleRecording = () => {
    setIsRecording((prev) => !prev);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border/50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Video className="h-5 w-5 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight">
                Crear Video para {firstName}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Videos personalizados, animaciones y mensajes de voz
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-border/50">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            {activeTab === "templates" && (
              <motion.div key="templates" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl.id)}
                      className={`group relative rounded-xl border-2 p-4 text-left transition-all ${
                        selectedTemplate === tpl.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/40"
                      }`}
                    >
                      <div className={`mb-3 flex h-20 items-center justify-center rounded-lg ${tpl.preview}`}>
                        <tpl.icon className={`h-8 w-8 ${selectedTemplate === tpl.id ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <p className="text-sm font-medium text-foreground">{tpl.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
                      <span className="mt-2 inline-block rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tpl.duration}</span>
                    </button>
                  ))}
                </div>
                <Button variant="hero" size="lg" className="w-full gap-2" disabled={!selectedTemplate || isGenerating} onClick={handleGenerate}>
                  {isGenerating ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Sparkles className="h-4 w-4" /></motion.div>
                      Generando video...
                    </>
                  ) : (
                    <><Play className="h-4 w-4" />Generar Video con Template</>
                  )}
                </Button>
              </motion.div>
            )}

            {activeTab === "custom" && (
              <motion.div key="custom" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div className="rounded-xl bg-accent/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wand2 className="h-4 w-4 text-accent" />
                    <p className="text-sm font-medium text-foreground">Animación generada con IA</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">Describe la animación que quieres y la IA la creará automáticamente.</p>
                </div>
                <Input placeholder={`Ej: "Video de cumpleaños estilo neón con fuegos artificiales"`} value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} className="text-sm" />
                <div className="flex flex-wrap gap-2">
                  {["Cinematográfico", "Minimalista", "Fiesta", "Elegante"].map((style) => (
                    <button key={style} onClick={() => setCustomMessage((prev) => prev ? `${prev}, estilo ${style.toLowerCase()}` : `Estilo ${style.toLowerCase()}`)} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">{style}</button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[{ icon: Music, label: "Agregar música" }, { icon: Image, label: "Subir fotos" }, { icon: Type, label: "Texto animado" }].map((opt) => (
                    <button key={opt.label} className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 p-3 text-center transition-colors hover:border-primary/40 hover:bg-primary/5">
                      <opt.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[11px] font-medium text-muted-foreground">{opt.label}</span>
                    </button>
                  ))}
                </div>
                <Button variant="ai" size="lg" className="w-full gap-2" disabled={!customMessage || isGenerating} onClick={handleGenerate}>
                  {isGenerating ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Sparkles className="h-4 w-4" /></motion.div>
                      Creando animación IA...
                    </>
                  ) : (
                    <><Wand2 className="h-4 w-4" />Crear Animación con IA<span className="tabular-nums font-semibold">— $79</span></>
                  )}
                </Button>
              </motion.div>
            )}

            {activeTab === "voice" && (
              <motion.div key="voice" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div className="rounded-xl bg-accent/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="h-4 w-4 text-accent" />
                    <p className="text-sm font-medium text-foreground">Mensaje de voz personalizado</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">Graba tu voz o escribe un mensaje. La IA lo convertirá en audio con fondo musical.</p>
                </div>
                <div className="flex flex-col items-center gap-4 py-4">
                  <button onClick={toggleRecording} className={`flex h-20 w-20 items-center justify-center rounded-full transition-all ${isRecording ? "bg-destructive/10 ring-4 ring-destructive/20" : "bg-primary/10 hover:bg-primary/20"}`}>
                    <Mic className={`h-8 w-8 ${isRecording ? "text-destructive" : "text-primary"}`} />
                  </button>
                  <p className="text-sm text-muted-foreground">{isRecording ? "Grabando... toca para detener" : "Toca para grabar tu mensaje"}</p>
                  {isRecording && (
                    <motion.div className="flex gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {[...Array(5)].map((_, i) => (
                        <motion.div key={i} className="w-1 rounded-full bg-destructive" animate={{ height: [8, 24, 8] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }} />
                      ))}
                    </motion.div>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-x-0 top-0 flex items-center justify-center">
                    <span className="bg-background px-3 text-xs text-muted-foreground -translate-y-1/2">o escribe tu mensaje</span>
                  </div>
                  <div className="border-t border-border/50 pt-4">
                    <Textarea placeholder={`"Feliz cumpleaños ${firstName}, te quiero mucho..."`} value={voiceMessage} onChange={(e) => setVoiceMessage(e.target.value)} rows={3} className="text-sm" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Fondo musical:</span>
                  {["Acústico", "Piano", "Orquesta", "Pop"].map((bg) => (
                    <button key={bg} className="rounded-lg bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">{bg}</button>
                  ))}
                </div>
                <Button variant="hero" size="lg" className="w-full gap-2" disabled={(!voiceMessage && !isRecording) || isGenerating} onClick={handleGenerate}>
                  {isGenerating ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Sparkles className="h-4 w-4" /></motion.div>
                      Generando audio...
                    </>
                  ) : (
                    <><Mic className="h-4 w-4" />Crear Audio Personalizado</>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
