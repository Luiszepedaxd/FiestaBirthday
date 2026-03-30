import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, Loader2, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { type Contact, useContacts } from "@/hooks/useContacts";

const dashboardQueryClient = new QueryClient();

const ADMIN_EMAIL = "luis.j20000@gmail.com";

const supportsContactPicker =
  typeof navigator !== "undefined" &&
  "contacts" in navigator &&
  typeof window !== "undefined" &&
  "ContactsManager" in window;

function normalizeImportedPhone(tel: string): string {
  return tel.replace(/[\s-]/g, "");
}

const OPENROUTER_SETTINGS_KEY = "openrouter_api_key";

type GiftSuggestionItem = {
  title: string;
  description: string;
  price: string;
  buscarEn: string;
};

function parseGiftSuggestionsContent(raw: string): GiftSuggestionItem[] {
  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) text = fenced[1].trim();
  const parsed = JSON.parse(text) as unknown;
  let list: unknown[] = [];
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    parsed !== null &&
    "suggestions" in parsed &&
    Array.isArray((parsed as { suggestions: unknown[] }).suggestions)
  ) {
    list = (parsed as { suggestions: unknown[] }).suggestions;
  } else {
    throw new Error("Formato JSON inesperado");
  }
  return list.slice(0, 3).map((item) => {
    const o = item as Record<string, unknown>;
    return {
      title: String(o.title ?? o.titulo ?? ""),
      description: String(o.description ?? o.descripcion ?? ""),
      price: String(o.price ?? o.precio ?? ""),
      buscarEn: String(o.buscar_en ?? o.buscarEn ?? ""),
    };
  });
}

const contactSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio"),
    birthday: z.date().optional(),
    phone: z.string().optional(),
    interests: z.string().optional(),
  })
  .refine((data) => data.birthday !== undefined, {
    message: "La fecha de cumpleaños es obligatoria",
    path: ["birthday"],
  });

type ContactFormValues = z.infer<typeof contactSchema>;
type FormMode = "create" | "edit";

const formatBirthday = (birthday: string) =>
  new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" }).format(new Date(birthday));

const parseBirthday = (birthday: string) => {
  if (!birthday) return undefined;
  const [year, month, day] = birthday.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const getDaysUntil = (birthday: string): number => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const parsed = new Date(birthday);
  const month = parsed.getMonth();
  const day = parsed.getDate();
  const candidate = new Date(now.getFullYear(), month, day);
  if (candidate.getTime() < today.getTime()) {
    candidate.setFullYear(now.getFullYear() + 1);
  }
  return Math.round((candidate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const contactEditBtnClass =
  "shrink-0 rounded-full border border-[#5221D6] bg-white px-3 py-1 text-xs font-medium text-[#5221D6] hover:bg-[#5221D6]/5";

const contactDeleteIconBtnClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#FF4444] hover:bg-red-50 hover:text-[#FF4444]";

type SectionVariant = "today" | "week" | "month" | "further";

const sectionBorder: Record<SectionVariant, string> = {
  today: "#C6017F",
  week: "#5221D6",
  month: "#94A3B8",
  further: "#E5E5E5",
};

const sectionAvatarBg: Record<SectionVariant, string> = {
  today: "#C6017F",
  week: "#5221D6",
  month: "#64748B",
  further: "#717B99",
};

function SectionBirthdayCard({
  contact,
  days,
  variant,
  onFelicitar,
  onSugerirRegalo,
}: {
  contact: Contact;
  days: number;
  variant: SectionVariant;
  onFelicitar?: () => void;
  onSugerirRegalo?: () => void;
}) {
  const badgeLabel =
    variant === "today"
      ? "¡Hoy!"
      : `en ${days} día${days === 1 ? "" : "s"}`;
  const badgeClass =
    variant === "today"
      ? "bg-[#FFF0F9] text-[#C6017F]"
      : variant === "week"
        ? "bg-[#F0F0FF] text-[#5221D6]"
        : variant === "month"
          ? "bg-[#F1F5F9] text-[#64748B]"
          : "bg-[#F5F5F5] text-[#717B99]";

  return (
    <div
      className="overflow-hidden rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
      style={{ borderLeft: `3px solid ${sectionBorder[variant]}` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: sectionAvatarBg[variant] }}
        >
          {getInitials(contact.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-bold text-[#141413]">{contact.name}</p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
              {badgeLabel}
            </span>
          </div>
          <p className="mt-0.5 text-[13px] text-[#717B99]">{formatBirthday(contact.birthday)}</p>
        </div>
      </div>
      {(onFelicitar || onSugerirRegalo) ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {onFelicitar ? (
            <button
              type="button"
              onClick={onFelicitar}
              className="rounded-full border border-[#C6017F] bg-white px-3 py-1.5 text-xs font-semibold text-[#C6017F] hover:bg-[#FFF0F9]"
            >
              Felicitar 🎉
            </button>
          ) : null}
          {onSugerirRegalo ? (
            <button
              type="button"
              onClick={onSugerirRegalo}
              className="rounded-full border border-[#5221D6] bg-white px-3 py-1.5 text-xs font-semibold text-[#5221D6] hover:bg-[#5221D6]/5"
            >
              Sugerir regalo 🎁
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function getEmailInitials(email: string | null): string {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "?";
}

type CongratModalProps = {
  contact: Contact | null;
  open: boolean;
  onClose: () => void;
  initialGiftView?: "main" | "budget";
};

type GiftPhase = "idle" | "loading" | "error";
type GiftView = "main" | "budget" | "results";

const BUDGET_PILLS = [
  { id: "r1" as const, label: "$200-500", value: 350 },
  { id: "r2" as const, label: "$500-1000", value: 750 },
  { id: "r3" as const, label: "$1000-2500", value: 1750 },
];

const CongratModal = ({ contact, open, onClose, initialGiftView = "main" }: CongratModalProps) => {
  const queryClient = useQueryClient();
  const [giftView, setGiftView] = useState<GiftView>("main");
  const [giftPhase, setGiftPhase] = useState<GiftPhase>("idle");
  const [giftItems, setGiftItems] = useState<GiftSuggestionItem[]>([]);
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetPill, setBudgetPill] = useState<(typeof BUDGET_PILLS)[number]["id"] | null>(null);
  const [giftSuggestionsFromProfile, setGiftSuggestionsFromProfile] = useState(false);

  useEffect(() => {
    if (!open) {
      setGiftView("main");
      setGiftPhase("idle");
      setGiftItems([]);
      setBudgetInput("");
      setBudgetPill(null);
      setGiftSuggestionsFromProfile(false);
      return;
    }
    setGiftView(initialGiftView);
    setGiftPhase("idle");
    setGiftItems([]);
    setBudgetInput("");
    setBudgetPill(null);
    setGiftSuggestionsFromProfile(false);
  }, [open, contact?.id, initialGiftView]);

  const handleWhatsApp = () => {
    if (!contact) return;
    if (!contact.phone) {
      toast("Este contacto no tiene teléfono guardado");
      return;
    }
    const phone = contact.phone.replace(/[\s\-]/g, "");
    const name = encodeURIComponent(contact.name);
    window.open(
      `https://wa.me/52${phone}?text=¡Hola%20${name}!%20🎂%20¡Feliz%20cumpleaños!%20Espero%20que%20tengas%20un%20día%20increíble%20🎉`,
      "_blank",
    );
  };

  const handleGenerateGiftSuggestions = async () => {
    if (!contact) return;
    const presupuesto = Number.parseFloat(budgetInput.replace(",", ".").trim());
    if (Number.isNaN(presupuesto) || presupuesto <= 0) return;

    setGiftPhase("loading");
    try {
      const { data: settingsRow, error: settingsError } = await supabase
        .from("settings")
        .select("value")
        .eq("key", OPENROUTER_SETTINGS_KEY)
        .maybeSingle();
      if (settingsError) throw settingsError;
      const apiKey = settingsRow?.value;
      if (!apiKey) throw new Error("missing_api_key");

      const { data: configRow, error: configError } = await supabase
        .from("ai_config")
        .select("model, prompt")
        .eq("feature", "gift_suggestions")
        .maybeSingle();
      if (configError) throw configError;
      if (!configRow?.model || !configRow?.prompt) throw new Error("missing_config");

      const historial =
        contact.gift_history != null ? JSON.stringify(contact.gift_history) : "ninguno";

      let interestsForPrompt = contact.interests || "no especificados";
      let profileTastesNote = "";
      let usedProfileInterests = false;

      const phoneTrimmed = contact.phone?.trim();
      if (phoneTrimmed) {
        const { data: contactProfile, error: contactProfileError } = await supabase
          .from("profiles")
          .select("interest_categories, interest_tags, full_name")
          .eq("phone", phoneTrimmed)
          .single();

        if (!contactProfileError && contactProfile) {
          const cats = Array.isArray(contactProfile.interest_categories)
            ? contactProfile.interest_categories
            : [];
          const tags = Array.isArray(contactProfile.interest_tags) ? contactProfile.interest_tags : [];
          const merged = [...cats, ...tags].filter((x): x is string => typeof x === "string");
          if (merged.length > 0) {
            interestsForPrompt = merged.join(", ");
            profileTastesNote =
              "\nNota: Esta persona registró sus propios gustos en la app.";
            usedProfileInterests = true;
          }
        }
      }

      const userContent = `Nombre: ${contact.name}. 
Intereses: ${interestsForPrompt}.${profileTastesNote}
Presupuesto: $${presupuesto} MXN.
Historial de regalos previos: ${historial}`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: configRow.model,
          messages: [
            { role: "system", content: configRow.prompt },
            { role: "user", content: userContent },
          ],
        }),
      });

      const json = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(json.error?.message || "openrouter_error");
      }
      const raw = json.choices?.[0]?.message?.content;
      if (!raw) throw new Error("empty_content");

      const items = parseGiftSuggestionsContent(raw);
      setGiftItems(items);
      setGiftSuggestionsFromProfile(usedProfileInterests);
      setGiftView("results");
      setGiftPhase("idle");

      const giftHistory = {
        date: new Date().toISOString(),
        suggestions: items.map((i) => ({
          titulo: i.title,
          descripcion: i.description,
          precio: i.price,
          buscar_en: i.buscarEn,
        })),
      };
      const { error: giftSaveError } = await supabase
        .from("contacts")
        .update({ gift_history: giftHistory })
        .eq("id", contact.id);
      if (!giftSaveError) {
        await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      }
    } catch {
      setGiftPhase("error");
      setGiftItems([]);
      setGiftSuggestionsFromProfile(false);
    }
  };

  if (!contact) return null;

  const giftLoading = giftPhase === "loading";
  const budgetNum = Number.parseFloat(budgetInput.replace(",", ".").trim());
  const presupuestoValid = !Number.isNaN(budgetNum) && budgetNum > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-full h-full max-w-full m-0 rounded-none sm:rounded-2xl sm:max-w-md sm:h-auto sm:m-auto p-0">
        <div className="overflow-y-auto max-h-[90vh]">
        <DialogTitle className="sr-only">Felicitar a {contact.name}</DialogTitle>
        <DialogDescription className="sr-only">Elige cómo quieres felicitar a {contact.name}</DialogDescription>

        {/* Header */}
        <div className="relative flex flex-col items-center px-6 pb-4 pt-10 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{ backgroundColor: "#C6017F" }}
          >
            {getInitials(contact.name)}
          </div>
          <p className="mt-3 text-2xl font-bold text-[#2E2D2C]">{contact.name}</p>
          <p className="mt-1 text-sm text-[#717B99]">Cumpleaños: {formatBirthday(contact.birthday)}</p>
        </div>

        {giftView === "main" && (
        <div className="px-6 pb-8">
          <p className="mb-3 text-[14px] text-[#717B99]">¿Cómo quieres felicitar?</p>
          <div className="space-y-3">

            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex w-full items-center gap-4 rounded-xl border-l-[3px] p-4 text-left transition-opacity hover:opacity-80"
              style={{ borderLeftColor: "#25D366", backgroundColor: "#F0FFF4", borderTop: "1px solid #E5F9EE", borderRight: "1px solid #E5F9EE", borderBottom: "1px solid #E5F9EE" }}
            >
              <span className="text-2xl">💬</span>
              <div>
                <p className="font-bold text-[#2E2D2C]">WhatsApp</p>
                <p className="text-xs text-[#717B99]">Mensaje directo personalizado</p>
              </div>
            </button>

            {/* Sugerir regalo */}
            <button
              type="button"
              onClick={() => {
                setGiftView("budget");
                setGiftPhase("idle");
                setBudgetInput("");
                setBudgetPill(null);
              }}
              className="flex w-full items-center gap-4 rounded-xl border-l-[3px] p-4 text-left transition-opacity hover:opacity-80"
              style={{ borderLeftColor: "#C6017F", backgroundColor: "#FFF0F9", borderTop: "1px solid #F9E0F3", borderRight: "1px solid #F9E0F3", borderBottom: "1px solid #F9E0F3" }}
            >
              <span className="text-2xl">🎁</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#2E2D2C]">Sugerir regalo</p>
                <p className="text-xs text-[#717B99]">Ideas según sus gustos</p>
              </div>
            </button>

            {/* Canción IA */}
            <div
              className="flex w-full items-center gap-4 rounded-xl border-l-[3px] p-4 text-left"
              style={{ borderLeftColor: "#C6017F", backgroundColor: "#FFF0F9", borderTop: "1px solid #F9E0F3", borderRight: "1px solid #F9E0F3", borderBottom: "1px solid #F9E0F3", opacity: 0.6 }}
            >
              <span className="text-2xl">🎵</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[#2E2D2C]">Canción con IA</p>
                  <span className="rounded-full bg-[#E5E5E5] px-2 py-0.5 text-[10px] font-semibold text-[#717B99]">Próximamente</span>
                </div>
                <p className="text-xs text-[#717B99]">Letra personalizada con sus gustos</p>
              </div>
            </div>

            {/* Organizar fiesta */}
            <button
              type="button"
              onClick={() => window.open("https://fiestamas.com/c", "_blank")}
              className="flex w-full items-center gap-4 rounded-xl border-l-[3px] p-4 text-left transition-opacity hover:opacity-80"
              style={{ borderLeftColor: "#F59E0B", backgroundColor: "#FFFBF0", borderTop: "1px solid #FEF3D0", borderRight: "1px solid #FEF3D0", borderBottom: "1px solid #FEF3D0" }}
            >
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-bold text-[#2E2D2C]">Organizar fiesta</p>
                <p className="text-xs text-[#717B99]">Salón, música, decoración y más</p>
              </div>
            </button>

          </div>
        </div>
        )}

        {giftView === "budget" && (
        <div className="px-6 pb-8">
          <button
            type="button"
            onClick={() => {
              setGiftView("main");
              setGiftPhase("idle");
            }}
            className="mb-4 text-left text-xs font-medium text-[#717B99] hover:text-[#2E2D2C]"
          >
            ← Volver
          </button>

          {giftLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <Loader2 className="h-8 w-8 animate-spin text-[#C6017F]" />
              <p className="text-sm text-[#717B99]">Generando sugerencias...</p>
            </div>
          ) : (
            <>
              <p className="text-base font-bold text-[#2E2D2C]">¿Cuál es tu presupuesto?</p>

              <div
                className="mt-4 flex h-12 items-center rounded-[12px] border border-[#E5E5E5] bg-white px-3 transition-colors focus-within:border-[#C6017F]"
              >
                <span className="shrink-0 text-sm text-[#717B99]">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="500"
                  value={budgetInput}
                  onChange={(e) => {
                    setBudgetInput(e.target.value);
                    setBudgetPill(null);
                  }}
                  className="min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-[#2E2D2C] outline-none placeholder:text-[#A1A1A0] focus:ring-0"
                />
                <span className="shrink-0 text-sm text-[#717B99]">MXN</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {BUDGET_PILLS.map((p) => {
                  const active = budgetPill === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setBudgetPill(p.id);
                        setBudgetInput(String(p.value));
                      }}
                      className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                      style={
                        active
                          ? { borderColor: "#C6017F", backgroundColor: "#C6017F", color: "#FFFFFF" }
                          : { borderColor: "#C6017F", backgroundColor: "#FFFFFF", color: "#C6017F" }
                      }
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {giftPhase === "error" && (
                <p className="mt-3 text-center text-sm text-red-600">No se pudieron generar sugerencias</p>
              )}

              <button
                type="button"
                disabled={!presupuestoValid || giftLoading}
                onClick={() => void handleGenerateGiftSuggestions()}
                className="mt-5 h-12 w-full rounded-[12px] text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: "#C6017F" }}
              >
                Generar sugerencias
              </button>
            </>
          )}
        </div>
        )}

        {giftView === "results" && (
        <div className="px-6 pb-8">
          <button
            type="button"
            onClick={() => setGiftView("budget")}
            className="mb-4 text-left text-xs font-medium text-[#717B99] hover:text-[#2E2D2C]"
          >
            Volver
          </button>

          {giftSuggestionsFromProfile && (
            <p
              className="mb-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ backgroundColor: "#FFF0F9", color: "#C6017F" }}
            >
              ✨ Basado en sus gustos reales
            </p>
          )}

          <div className="space-y-4">
            {giftItems.map((item, i) => (
              <div
                key={`${item.title}-${i}`}
                className="rounded-xl border border-[#F9E0F3] border-l-[3px] bg-[#FFF0F9] p-4"
                style={{ borderLeftColor: "#C6017F" }}
              >
                <p className="font-bold text-[#2E2D2C]">{item.title}</p>
                <p className="mt-1 text-xs text-[#717B99]">{item.description}</p>
                <span className="mt-2 inline-block rounded-full bg-[#C6017F] px-3 py-1 text-xs font-semibold text-white">
                  {item.price}
                </span>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`https://www.amazon.com.mx/s?k=${encodeURIComponent(item.buscarEn)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                    style={{ borderColor: "#FF9900", color: "#FF9900" }}
                  >
                    🛒 Amazon
                  </a>
                  <a
                    href={`https://listado.mercadolibre.com.mx/${encodeURIComponent(item.buscarEn)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                    style={{ borderColor: "#FFE600", color: "#333333", backgroundColor: "#FFE600" }}
                  >
                    🏪 Mercado Libre
                  </a>
                  <a
                    href={`https://www.google.com.mx/search?q=${encodeURIComponent(`${item.buscarEn} comprar mexico`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                    style={{ borderColor: "#4285F4", color: "#4285F4" }}
                  >
                    🔍 Google
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DashboardContent = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoading, isError, error, orderedContacts } = useContacts();

  const todayContacts = orderedContacts.filter((c) => getDaysUntil(c.birthday) === 0);
  const todayBirthdays = todayContacts;
  const weekContacts = orderedContacts.filter((c) => {
    const days = getDaysUntil(c.birthday);
    return days >= 1 && days <= 7;
  });
  const monthWindowContacts = orderedContacts.filter((c) => {
    const days = getDaysUntil(c.birthday);
    return days >= 8 && days <= 30;
  });
  const furtherContacts = orderedContacts.filter((c) => getDaysUntil(c.birthday) > 30);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactPendingDelete, setContactPendingDelete] = useState<Contact | null>(null);
  const [isCongratModalOpen, setIsCongratModalOpen] = useState(false);
  const [congratContact, setCongratContact] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showAdminNav, setShowAdminNav] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [congratOpenGift, setCongratOpenGift] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const importQueueRef = useRef<{ name: string; phone: string }[]>([]);
  const importIndexRef = useRef(0);
  const importActiveRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setOnboardingReady(true);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileError && (!profile || profile.onboarding_completed !== true)) {
        navigate("/onboarding", { replace: true });
        return;
      }

      setShowAdminNav(user.email === ADMIN_EMAIL);
      setUserEmail(user.email ?? null);
      setOnboardingReady(true);
    };
    void load();
  }, [navigate]);

  const openCongratModal = (contact: Contact) => {
    setCongratOpenGift(false);
    setCongratContact(contact);
    setIsCongratModalOpen(true);
  };

  const openGiftBudgetModal = (contact: Contact) => {
    setCongratOpenGift(true);
    setCongratContact(contact);
    setIsCongratModalOpen(true);
  };

  const closeCongratModal = () => {
    setIsCongratModalOpen(false);
    setCongratOpenGift(false);
  };

  const contactQuery = contactSearch.trim().toLowerCase();
  const filteredContacts = orderedContacts.filter((c) => {
    if (!contactQuery) return true;
    const hay = `${c.name} ${c.phone ?? ""} ${formatBirthday(c.birthday)}`.toLowerCase();
    return hay.includes(contactQuery);
  });

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      phone: "",
      interests: "",
    },
  });

  const { reset } = form;
  const birthdayWatch = form.watch("birthday");

  useEffect(() => {
    if (formMode !== "edit" || !selectedContact) return;
    reset({
      name: selectedContact.name,
      birthday: parseBirthday(selectedContact.birthday),
      phone: selectedContact.phone || "",
      interests: selectedContact.interests || "",
    });
  }, [formMode, selectedContact, reset]);

  const saveContactMutation = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("No hay usuario autenticado");

      const payload = {
        name: values.name.trim(),
        birthday: format(values.birthday!, "yyyy-MM-dd"),
        phone: values.phone?.trim() || null,
        interests: values.interests?.trim() || null,
      };

      if (formMode === "edit" && selectedContact) {
        const { error: updateError } = await supabase
          .from("contacts")
          .update(payload)
          .eq("id", selectedContact.id)
          .eq("user_id", user.id);
        if (updateError) throw updateError;
        return;
      }

      const { error: insertError } = await supabase.from("contacts").insert({
        ...payload,
        user_id: user.id,
      });

      if (insertError) throw insertError;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });

      if (importActiveRef.current) {
        const queue = importQueueRef.current;
        const idx = importIndexRef.current;
        if (idx + 1 < queue.length) {
          importIndexRef.current = idx + 1;
          const next = queue[idx + 1];
          setImportProgress({ current: idx + 2, total: queue.length });
          setSubmitError(null);
          reset({
            name: next.name,
            phone: next.phone,
            interests: "",
            birthday: undefined,
          });
          return;
        }
        importActiveRef.current = false;
        importQueueRef.current = [];
        importIndexRef.current = 0;
        setImportProgress(null);
      }

      setIsFormDrawerOpen(false);
      setSelectedContact(null);
      reset({ name: "", phone: "", interests: "", birthday: undefined });
    },
    onError: (mutationError) => {
      setSubmitError(mutationError instanceof Error ? mutationError.message : "Error al guardar el contacto");
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("No hay usuario autenticado");

      const { error: deleteError } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contactId)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;
    },
    onSuccess: async (_data, deletedId) => {
      setDeleteDialogOpen(false);
      setContactPendingDelete(null);
      let closedEditForDeleted = false;
      setSelectedContact((prev) => {
        if (prev?.id === deletedId) {
          closedEditForDeleted = true;
          return null;
        }
        return prev;
      });
      if (closedEditForDeleted) setIsFormDrawerOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const clearContactImportFlow = () => {
    importActiveRef.current = false;
    importQueueRef.current = [];
    importIndexRef.current = 0;
    setImportProgress(null);
  };

  const handleFormDialogOpenChange = (open: boolean) => {
    setIsFormDrawerOpen(open);
    if (!open) {
      clearContactImportFlow();
    }
  };

  const openCreateDialog = () => {
    clearContactImportFlow();
    setSubmitError(null);
    setFormMode("create");
    setSelectedContact(null);
    reset({ name: "", phone: "", interests: "", birthday: undefined });
    setIsFormDrawerOpen(true);
  };

  const handleImportContacts = async () => {
    if (!supportsContactPicker || !navigator.contacts) return;
    try {
      const picked = await navigator.contacts.select(["name", "tel"], { multiple: true });
      if (!picked?.length) return;

      const prepared: { name: string; phone: string }[] = [];
      for (const c of picked) {
        const name = c.name?.[0]?.trim();
        const rawTel = c.tel?.[0];
        const phone = rawTel ? normalizeImportedPhone(rawTel) : "";
        if (name && phone) prepared.push({ name, phone });
      }
      if (prepared.length === 0) return;

      importActiveRef.current = true;
      importQueueRef.current = prepared;
      importIndexRef.current = 0;
      setImportProgress(
        prepared.length > 1 ? { current: 1, total: prepared.length } : null,
      );
      setSubmitError(null);
      setFormMode("create");
      setSelectedContact(null);
      reset({
        name: prepared[0].name,
        phone: prepared[0].phone,
        interests: "",
        birthday: undefined,
      });
      setIsFormDrawerOpen(true);
    } catch (e) {
      if (e instanceof DOMException && e.name === "NotAllowedError") {
        toast("Permisos denegados para acceder a contactos");
        return;
      }
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }
      toast("No se pudieron importar los contactos");
    }
  };

  const openEditContact = (contact: Contact) => {
    setSubmitError(null);
    setFormMode("edit");
    setSelectedContact(contact);
    setIsFormDrawerOpen(true);
  };

  const openDeleteConfirm = (contact: Contact) => {
    setContactPendingDelete(contact);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (values: ContactFormValues) => {
    setSubmitError(null);
    saveContactMutation.mutate(values);
  };

  if (!onboardingReady) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#FAF9F5]"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-[#C6017F]" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#FAF9F5] text-[#2E2D2C]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#F2F2F2] bg-white">
        <div className="mx-auto flex h-16 w-full max-w-[640px] items-center justify-between px-4">
          <p className="text-xl font-bold lowercase tracking-tight text-[#C6017F]">fiestamas</p>
          <div className="flex items-center gap-2">
            {showAdminNav && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin")}
                className="h-8 border-[#C6017F] px-3 text-xs text-[#C6017F] hover:bg-[#FFF0F9] hover:text-[#C6017F]"
              >
                Admin
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5221D6] text-sm font-bold text-white outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#5221D6]"
                  aria-label="Menú de cuenta"
                >
                  {getEmailInitials(userEmail)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem className="cursor-pointer" onClick={() => void handleSignOut()}>
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[640px] space-y-6 px-4 pb-28 pt-[calc(4rem+16px)]">
        {isLoading && (
          <section className="space-y-6">
            <Skeleton className="h-48 w-full rounded-[20px]" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </section>
        )}

        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            Error al cargar contactos: {error instanceof Error ? error.message : "Error desconocido"}
          </div>
        )}

        {!isLoading && !isError && orderedContacts.length === 0 && (
          <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center px-4 py-12 text-center">
            <span className="text-[80px] leading-none" aria-hidden>
              🎂
            </span>
            <h2 className="mt-6 text-xl font-bold text-[#141413]">Aún no tienes contactos</h2>
            <p className="mt-2 max-w-sm text-sm text-[#717B99]">
              Guarda los cumpleaños de las personas que más quieres
            </p>
            <Button
              type="button"
              className="mt-8 h-12 rounded-full bg-[#C6017F] px-8 text-white hover:bg-[#B10072]"
              onClick={openCreateDialog}
            >
              Agregar el primero
            </Button>
          </div>
        )}

        {!isLoading && !isError && orderedContacts.length > 0 && (
          <>
            {(() => {
              const heroContact = todayBirthdays.length > 0 ? todayBirthdays[0] : orderedContacts[0];
              const isToday = todayBirthdays.length > 0;
              const days = heroContact.daysUntilBirthday;
              const badgeLabel = isToday ? "🎂 Hoy es su día" : `🎂 En ${days} día${days === 1 ? "" : "s"}`;
              return (
                <section className="mx-0 mt-4 sm:mx-0">
                  <div
                    className="relative overflow-hidden"
                    style={{
                      backgroundImage: "url(/birthday-hero.jpg)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      borderRadius: "20px",
                    }}
                  >
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        borderRadius: "20px",
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 50%)",
                      }}
                      aria-hidden
                    />
                    <div className="relative z-10 flex min-h-[220px] flex-col justify-end p-6">
                      <div className="flex flex-col items-start text-left">
                        <span className="inline-flex rounded-full bg-[rgba(255,255,255,0.2)] px-3 py-1 text-xs font-semibold text-white">
                          {badgeLabel}
                        </span>
                        <p className="mt-3 text-[28px] font-bold leading-tight text-white">{heroContact.name}</p>
                        <p className="mt-1 text-sm text-[rgba(255,255,255,0.8)]">{formatBirthday(heroContact.birthday)}</p>
                        <button
                          type="button"
                          onClick={() => openCongratModal(heroContact)}
                          className="mt-4 h-11 shrink-0 rounded-full bg-white px-6 text-sm font-semibold text-[#C6017F]"
                        >
                          Felicitar 🎉
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })()}

            {todayContacts.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-bold text-[#141413]">Hoy 🎂</h2>
                <div className="space-y-3">
                  {todayContacts.map((contact) => (
                    <SectionBirthdayCard
                      key={contact.id}
                      contact={contact}
                      days={0}
                      variant="today"
                      onFelicitar={() => openCongratModal(contact)}
                      onSugerirRegalo={() => openGiftBudgetModal(contact)}
                    />
                  ))}
                </div>
              </section>
            )}

            {weekContacts.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-bold text-[#141413]">Esta semana 🎉</h2>
                <div className="space-y-3">
                  {weekContacts.map((contact) => {
                    const days = getDaysUntil(contact.birthday);
                    return (
                      <SectionBirthdayCard
                        key={contact.id}
                        contact={contact}
                        days={days}
                        variant="week"
                        onFelicitar={() => openCongratModal(contact)}
                        onSugerirRegalo={() => openGiftBudgetModal(contact)}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {monthWindowContacts.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-bold text-[#141413]">Este mes 📅</h2>
                <div className="space-y-3">
                  {monthWindowContacts.map((contact) => {
                    const days = getDaysUntil(contact.birthday);
                    return (
                      <SectionBirthdayCard
                        key={contact.id}
                        contact={contact}
                        days={days}
                        variant="month"
                        onFelicitar={() => openCongratModal(contact)}
                        onSugerirRegalo={() => openGiftBudgetModal(contact)}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {furtherContacts.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-bold text-[#141413]">Más adelante</h2>
                <div className="space-y-3">
                  {furtherContacts.map((contact) => {
                    const days = getDaysUntil(contact.birthday);
                    return (
                      <SectionBirthdayCard
                        key={contact.id}
                        contact={contact}
                        days={days}
                        variant="further"
                        onFelicitar={() => openCongratModal(contact)}
                        onSugerirRegalo={() => openGiftBudgetModal(contact)}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[#141413]">
                  Tus contactos ({orderedContacts.length})
                </h2>
                {supportsContactPicker ? (
                  <button
                    type="button"
                    onClick={() => void handleImportContacts()}
                    className="shrink-0 rounded-full border border-[#5221D6] bg-white px-3 py-1.5 text-[12px] font-medium text-[#5221D6] transition-colors hover:bg-[#5221D6]/5"
                  >
                    📱 Importar contactos
                  </button>
                ) : null}
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#717B99]" />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="h-11 rounded-xl border-[#E5E5E5] pl-9 focus-visible:border-[#C6017F] focus-visible:ring-1 focus-visible:ring-[#C6017F]"
                  aria-label="Buscar contactos"
                />
              </div>
              {filteredContacts.length === 0 ? (
                <p className="rounded-2xl bg-white py-8 text-center text-sm text-[#717B99] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                  Ningún contacto coincide con la búsqueda
                </p>
              ) : (
                <div className="divide-y divide-[#F2F2F2] overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                  {filteredContacts.map((contact) => (
                    <div key={contact.id} className="flex w-full items-center gap-3 p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#5221D6] text-sm font-bold text-white">
                        {getInitials(contact.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-[#141413]">{contact.name}</p>
                        <p className="truncate text-xs text-[#717B99]">{contact.phone || "Sin teléfono"}</p>
                        <p className="text-xs text-[#717B99]">{formatBirthday(contact.birthday)}</p>
                      </div>
                      <div className="flex shrink-0 flex-row items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditContact(contact)}
                          className={contactEditBtnClass}
                        >
                          Actualizar info
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteConfirm(contact)}
                          className={`${contactDeleteIconBtnClass} h-8 w-8`}
                          aria-label="Eliminar contacto"
                        >
                          <span className="text-base leading-none" aria-hidden>🗑️</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Button
        size="icon"
        className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full border-0 bg-[#C6017F] text-2xl text-white shadow-[0_4px_20px_rgba(198,1,127,0.5)] transition-transform hover:scale-[1.08] hover:bg-[#B10072]"
        onClick={openCreateDialog}
        aria-label="Agregar contacto"
      >
        +
      </Button>

      <Dialog open={isFormDrawerOpen} onOpenChange={handleFormDialogOpenChange}>
        <DialogContent className="w-full h-full max-w-full m-0 rounded-none sm:rounded-2xl sm:max-w-md sm:h-auto sm:m-auto overflow-y-auto p-0">
          <DialogTitle className="sr-only">
            {formMode === "create" ? "Nuevo contacto" : "Editar contacto"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {formMode === "create"
              ? "Completa los datos para guardar el contacto."
              : "Actualiza la información del contacto seleccionado."}
          </DialogDescription>
          <div className="px-6 pb-8 pt-10">
            <h2 className="mb-1 text-xl font-bold text-[#2E2D2C]">
              {formMode === "create" ? "Nuevo contacto" : "Editar contacto"}
            </h2>
            <p className="mb-6 text-sm text-[#717B99]">
              {formMode === "create"
                ? "Completa los datos para guardar el contacto."
                : "Actualiza la información del contacto seleccionado."}
            </p>
            {formMode === "create" && importProgress ? (
              <p className="mb-4 text-center text-xs font-medium text-[#717B99]">
                Contacto {importProgress.current} de {importProgress.total}
              </p>
            ) : null}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#2E2D2C]">Nombre</Label>
                <Input
                  id="name"
                  className="h-12 rounded-xl border-[#E5E5E5] focus-visible:ring-1 focus-visible:ring-[#C6017F]"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[#2E2D2C]">Fecha de cumpleaños</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-[#E5E5E5] focus:border-[#C6017F] rounded-xl h-12"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#717B99]" />
                      {birthdayWatch
                        ? format(birthdayWatch, "d 'de' MMMM", { locale: es })
                        : <span className="text-[#A1A1A0]">Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={birthdayWatch}
                      onSelect={(date) => {
                        form.setValue("birthday", date ?? undefined, { shouldValidate: true });
                        setCalendarOpen(false);
                      }}
                      locale={es}
                      showOutsideDays={false}
                      className="rounded-xl"
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.birthday && (
                  <p className="text-sm text-destructive">{form.formState.errors.birthday.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#2E2D2C]">Teléfono (opcional)</Label>
                <Input
                  id="phone"
                  className="h-12 rounded-xl border-[#E5E5E5] focus-visible:ring-1 focus-visible:ring-[#C6017F]"
                  {...form.register("phone")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests" className="text-[#2E2D2C]">
                  Intereses (opcional)
                </Label>
                <Input
                  id="interests"
                  placeholder="ej: Rock de los 80, yoga, café artesanal"
                  className="h-12 rounded-xl border-[#E5E5E5] focus-visible:ring-1 focus-visible:ring-[#C6017F]"
                  {...form.register("interests")}
                />
              </div>

              {submitError && <p className="text-sm text-destructive">{submitError}</p>}

              <Button
                type="submit"
                disabled={saveContactMutation.isPending}
                className="h-12 w-full rounded-xl bg-[#C6017F] text-white hover:bg-[#B10072]"
              >
                {saveContactMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                variant="outline"
                type="button"
                className="h-12 w-full rounded-xl"
                onClick={() => handleFormDialogOpenChange(false)}
              >
                Cancelar
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setContactPendingDelete(null);
        }}
      >
        <AlertDialogContent className="max-w-[90vw] rounded-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#2E2D2C]">
              ¿Eliminar a {contactPendingDelete?.name ?? ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={!contactPendingDelete || deleteContactMutation.isPending}
              className="bg-[#FF4444] hover:bg-[#E03E3E]"
              onClick={() => {
                if (!contactPendingDelete) return;
                deleteContactMutation.mutate(contactPendingDelete.id);
              }}
            >
              {deleteContactMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CongratModal
        contact={congratContact}
        open={isCongratModalOpen}
        onClose={closeCongratModal}
        initialGiftView={congratOpenGift ? "budget" : "main"}
      />
    </div>
  );
};

const Dashboard = () => (
  <QueryClientProvider client={dashboardQueryClient}>
    <DashboardContent />
  </QueryClientProvider>
);

export default Dashboard;
