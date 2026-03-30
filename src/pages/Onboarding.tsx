import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/sonner";

const INTEREST_CATEGORIES = [
  "🎵 Música",
  "🎮 Gaming",
  "📚 Libros",
  "🏃 Deporte",
  "🍕 Gastronomía",
  "🎨 Arte",
  "✈️ Viajes",
  "🎬 Cine",
  "🌿 Naturaleza",
  "💻 Tecnología",
  "🧘 Bienestar",
  "🎭 Teatro",
] as const;

const inputClass =
  "w-full rounded-[12px] border-[1.5px] border-[#E5E5E5] bg-white px-4 text-[#141413] outline-none transition-colors h-12 focus:border-[#C6017F] focus:ring-1 focus:ring-[#C6017F] placeholder:text-[#A1A1A0]";

const Onboarding = () => {
  const navigate = useNavigate();
  const [bootLoading, setBootLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState("");
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (!t) return;
    setCustomTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setTagInput("");
  }, [tagInput]);

  const removeTag = (tag: string) => {
    setCustomTags((prev) => prev.filter((x) => x !== tag));
  };

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setBootLoading(false);
        navigate("/login", { replace: true });
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, phone, interest_categories, interest_tags, onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        setBootLoading(false);
        return;
      }

      if (profile?.onboarding_completed === true) {
        navigate("/dashboard", { replace: true });
        return;
      }

      if (profile) {
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.phone) setPhone(profile.phone);
        const cats = profile.interest_categories;
        if (Array.isArray(cats)) {
          setSelectedCategories(new Set(cats.filter((c): c is string => typeof c === "string")));
        }
        const tags = profile.interest_tags;
        if (Array.isArray(tags)) {
          setCustomTags(tags.filter((t): t is string => typeof t === "string"));
        }
      }

      setBootLoading(false);
    };
    void load();
  }, [navigate]);

  const canSubmit =
    fullName.trim().length > 0 && selectedCategories.size >= 1 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      toast.error("No hay sesión activa");
      return;
    }

    setSaving(true);
    const payload = {
      id: user.id,
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      interest_categories: Array.from(selectedCategories),
      interest_tags: customTags,
      onboarding_completed: true,
    };

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });

    setSaving(false);

    if (error) {
      toast.error(error.message || "No se pudo guardar tu perfil");
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  if (bootLoading) {
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
      className="min-h-screen bg-[#FAF9F5] text-[#141413]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <header className="border-b border-[#F2F2F2] bg-white">
        <div className="mx-auto flex h-14 w-full max-w-[480px] items-center px-4">
          <span className="text-xl font-bold lowercase tracking-tight text-[#C6017F]">fiestamas</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[480px] px-4 pb-16 pt-8">
        <div className="text-center">
          <span className="block text-[48px] leading-none" aria-hidden>
            🎉
          </span>
          <h1 className="mt-4 text-[24px] font-bold leading-tight text-[#141413]">
            ¡Bienvenido a Circulo de Celebraciones by Fiestamas!
          </h1>
          <p className="mt-3 text-center text-[14px] leading-snug text-[#717B99]">
            Cuéntanos tus gustos para que tus contactos puedan sorprenderte mejor
          </p>
        </div>

        <div className="mt-10 space-y-6">
          <div className="space-y-2">
            <label htmlFor="onboarding-name" className="block text-sm font-medium text-[#141413]">
              ¿Cómo te llamas?
            </label>
            <input
              id="onboarding-name"
              type="text"
              placeholder="Tu nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="onboarding-phone" className="block text-sm font-medium text-[#141413]">
              Tu número de WhatsApp
            </label>
            <input
              id="onboarding-phone"
              type="text"
              placeholder="+52 33 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              autoComplete="tel"
            />
            <p className="text-[12px] text-[#717B99]">
              Tus contactos podrán encontrarte en el Círculo de Celebraciones
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-[#141413]">¿Qué te gusta?</p>
            <div className="grid grid-cols-3 gap-2">
              {INTEREST_CATEGORIES.map((label) => {
                const selected = selectedCategories.has(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleCategory(label)}
                    className="rounded-[20px] border-[1.5px] px-4 py-2 text-left text-sm transition-colors"
                    style={
                      selected
                        ? {
                            backgroundColor: "#FFF0F9",
                            color: "#C6017F",
                            borderColor: "#C6017F",
                          }
                        : {
                            backgroundColor: "#F5F5F5",
                            color: "#4D4D4C",
                            borderColor: "#E5E5E5",
                          }
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="onboarding-tags" className="block text-sm font-medium text-[#141413]">
              Agrega gustos específicos (opcional)
            </label>
            <div className="flex gap-2">
              <input
                id="onboarding-tags"
                type="text"
                placeholder="ej: Rock de los 80, sushi, yoga matutino"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className={`${inputClass} min-w-0 flex-1`}
              />
              <button
                type="button"
                onClick={addTag}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border-[1.5px] border-[#C6017F] text-[#C6017F] transition-colors hover:bg-[#FFF0F9]"
                aria-label="Agregar tag"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            {customTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {customTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-[#C6017F] bg-white px-3 py-1 text-sm text-[#C6017F]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded-full p-0.5 hover:bg-[#FFF0F9]"
                      aria-label={`Quitar ${tag}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
            className="flex h-[52px] w-full items-center justify-center rounded-[12px] bg-[#C6017F] text-base font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:bg-[#B10072]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
                Guardando...
              </>
            ) : (
              "Comenzar"
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
