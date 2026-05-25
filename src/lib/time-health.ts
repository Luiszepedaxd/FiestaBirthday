import {
  differenceInCalendarDays,
  format,
  isToday,
  parseISO,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCheck,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import type { TimeHealth } from "@/types/product-map";

export const TIME_HEALTH_CONFIG: Record<
  TimeHealth,
  { label: string; color: string; icon: LucideIcon }
> = {
  on_track: { label: "A tiempo", color: "#22C55E", icon: CheckCircle2 },
  at_risk: { label: "En riesgo", color: "#F59E0B", icon: AlertTriangle },
  overdue: { label: "Atrasado", color: "#EF4444", icon: AlertCircle },
  completed: { label: "Completado", color: "#22C55E", icon: CheckCheck },
  no_target: { label: "Sin fecha", color: "#9CA3AF", icon: Calendar },
};

export function formatDaysUntil(targetDate: string | null): string {
  if (!targetDate) return "Sin fecha objetivo";

  const target = startOfDay(parseISO(targetDate));
  const today = startOfDay(new Date());
  const diff = differenceInCalendarDays(target, today);

  if (diff === 0 || isToday(target)) return "Vence hoy";
  if (diff > 0) return `Faltan ${diff} día${diff === 1 ? "" : "s"}`;
  const overdueDays = Math.abs(diff);
  return `Atrasado ${overdueDays} día${overdueDays === 1 ? "" : "s"}`;
}

export function formatTargetDateLabel(targetDate: string | null): string | null {
  if (!targetDate) return null;
  return format(parseISO(targetDate), "dd/MM/yyyy", { locale: es });
}

export function getTimeHealthStroke(timeHealth: TimeHealth | undefined): string | null {
  if (timeHealth === "overdue") return "#EF4444";
  if (timeHealth === "at_risk") return "#F59E0B";
  return null;
}
