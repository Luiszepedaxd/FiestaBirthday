import { useState } from "react";
import { motion } from "framer-motion";
import { Music, Gift, Sparkles, Send, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SongCreatorDialog } from "./SongCreatorDialog";
import { GiftSuggestionDialog } from "./GiftSuggestionDialog";
import { VideoCreatorDialog } from "./VideoCreatorDialog";
import type { Contact } from "@/lib/mock-data";

interface Props {
  contact: Contact;
}

export function BirthdayHeroCard({ contact }: Props) {
  const [songOpen, setSongOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const sendWhatsApp = () => {
    const msg = `Feliz cumpleaños ${contact.name.split(" ")[0]}! Que la pases increíble hoy.`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="rounded-2xl border border-border bg-card p-6 md:p-8"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {contact.initials}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="h-3 w-3" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Hoy es el día de</p>
              <h2 className="text-2xl font-bold tracking-display text-foreground md:text-3xl">
                {contact.name}
              </h2>
            </div>

            {/* Interests */}
            <div className="flex flex-wrap gap-2">
              {contact.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {interest}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="gap-2 rounded-full"
                onClick={() => setSongOpen(true)}
              >
                <Music className="h-4 w-4" />
                <span>Regalar Canción IA</span>
                <span className="tabular-nums font-semibold opacity-80">— $49</span>
              </Button>
              <Button
                size="lg"
                className="gap-2 rounded-full"
                onClick={() => setVideoOpen(true)}
              >
                <Video className="h-4 w-4" />
                <span>Crear Video</span>
                <span className="tabular-nums font-semibold opacity-80">— $79</span>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full" onClick={sendWhatsApp}>
                <Send className="h-4 w-4" />
                Felicitar por WhatsApp
              </Button>
              <Button variant="outline" size="lg" className="rounded-full" onClick={() => setGiftOpen(true)}>
                <Gift className="h-4 w-4" />
                Sugerir regalo
              </Button>
            </div>

            {/* AI micro-copy */}
            <div className="flex items-start gap-2 rounded-xl bg-secondary p-3">
              <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground text-pretty leading-relaxed">
                Basado en sus gustos por el <strong className="text-foreground">{contact.interests[0]}</strong>.
                {contact.lastGiftNote && (
                  <span className="text-muted-foreground"> {contact.lastGiftNote}.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <SongCreatorDialog open={songOpen} onOpenChange={setSongOpen} contact={contact} />
      <GiftSuggestionDialog open={giftOpen} onOpenChange={setGiftOpen} contact={contact} />
      <VideoCreatorDialog open={videoOpen} onOpenChange={setVideoOpen} contact={contact} />
    </>
  );
}
