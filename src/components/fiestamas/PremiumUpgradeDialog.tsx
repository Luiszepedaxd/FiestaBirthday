import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Check, CreditCard, Shield, Palette, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: () => void;
}

const features = [
  { icon: Palette, label: "Templates exclusivos", desc: "Diseños elegantes, tropicales y neon" },
  { icon: Users, label: "Confirmación de invitados", desc: "Gestiona RSVPs con estadísticas en vivo" },
  { icon: Sparkles, label: "Diseños personalizados", desc: "Crea invitaciones únicas con tu estilo" },
  { icon: Shield, label: "Sin marca Fiestamas", desc: "Invitaciones con tu branding personal" },
];

export function PremiumUpgradeDialog({ open, onOpenChange, onUpgrade }: Props) {
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setDone(true);
      setTimeout(() => {
        onUpgrade();
        onOpenChange(false);
        setTimeout(() => setDone(false), 200);
      }, 1500);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 tracking-display">
            <Crown className="h-5 w-5 text-accent" />
            Fiestamas Premium
          </DialogTitle>
          <DialogDescription>
            Desbloquea diseños exclusivos y gestión de invitados.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"
            >
              <Check className="h-7 w-7 text-primary" />
            </motion.div>
            <p className="font-semibold text-foreground">Pago exitoso</p>
            <p className="text-sm text-muted-foreground">Ya tienes acceso Premium</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Features */}
            <div className="space-y-2">
              {features.map((f) => (
                <div key={f.label} className="flex items-start gap-3 rounded-xl bg-secondary p-3">
                  <f.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="flex items-center justify-between rounded-xl bg-accent/5 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Suscripción mensual</p>
                <p className="text-2xl font-semibold tabular-nums text-foreground">
                  $89 <span className="text-sm font-normal text-muted-foreground">MXN/mes</span>
                </p>
              </div>
              <Crown className="h-8 w-8 text-accent/30" />
            </div>

            {/* Simulated card */}
            <div className="rounded-xl bg-secondary p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tarjeta de pago</p>
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground tabular-nums">**** **** **** 4532</p>
                  <p className="text-[11px] text-muted-foreground">Visa terminada en 4532</p>
                </div>
                <Check className="h-4 w-4 text-primary" />
              </div>
            </div>

            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handlePay}
              disabled={processing}
            >
              {processing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <CreditCard className="h-4 w-4" />
                  </motion.div>
                  Procesando pago...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Pagar $89 MXN / mes
                </>
              )}
            </Button>

            <p className="text-center text-[11px] text-muted-foreground">
              Cancela en cualquier momento. Sin compromisos.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
