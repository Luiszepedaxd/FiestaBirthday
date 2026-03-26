import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "luis.j20000@gmail.com";

const OPENROUTER_SETTINGS_KEY = "openrouter_api_key";

const FALLBACK_MODELS = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "openai/gpt-4o", name: "GPT-4o" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku" },
  { id: "anthropic/claude-3-5-sonnet", name: "Claude 3.5 Sonnet" },
  { id: "meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 8B" },
];

const FEATURES = [
  {
    key: "gift_suggestions",
    icon: "🎁",
    title: "Sugerencias de regalo",
    desc: "Genera ideas de regalo basadas en intereses",
  },
  {
    key: "song_lyrics",
    icon: "🎵",
    title: "Canción con IA",
    desc: "Genera letra personalizada de cumpleaños",
  },
  {
    key: "whatsapp_message",
    icon: "💬",
    title: "Mensaje WhatsApp",
    desc: "Genera mensaje personalizado de felicitación",
  },
  {
    key: "video_script",
    icon: "🎬",
    title: "Video de felicitación",
    desc: "Genera el guión para el video con IA",
  },
];

type AiConfigRow = {
  feature: string;
  model: string;
  prompt: string | null;
};

function obfuscateApiKey(key: string): string {
  if (!key) return "";
  return `${key.slice(0, 8)}••••••••`;
}

const adminQueryClient = new QueryClient();

const AdminContent = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [checking, setChecking] = useState(true);
  const [localModels, setLocalModels] = useState<Record<string, string>>({});
  const [localPrompts, setLocalPrompts] = useState<Record<string, string>>({});
  const [savingFeature, setSavingFeature] = useState<string | null>(null);

  const [openrouterKeyInput, setOpenrouterKeyInput] = useState("");
  const [storedOpenrouterKey, setStoredOpenrouterKey] = useState<string | null>(null);
  const [openrouterKeyDirty, setOpenrouterKeyDirty] = useState(false);
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);
  const [savingOpenrouterKey, setSavingOpenrouterKey] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.email !== ADMIN_EMAIL) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setChecking(false);
    };
    void check();
  }, [navigate]);

  const { data: settingsRow } = useQuery({
    queryKey: ["settings", OPENROUTER_SETTINGS_KEY],
    enabled: !checking,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value")
        .eq("key", OPENROUTER_SETTINGS_KEY)
        .maybeSingle();
      if (error) throw error;
      return data as { key: string; value: string } | null;
    },
  });

  useEffect(() => {
    if (settingsRow === undefined) return;
    if (settingsRow?.value) {
      setStoredOpenrouterKey(settingsRow.value);
      setOpenrouterKeyInput(obfuscateApiKey(settingsRow.value));
      setOpenrouterKeyDirty(false);
    } else {
      setStoredOpenrouterKey(null);
      setOpenrouterKeyInput("");
      setOpenrouterKeyDirty(false);
    }
  }, [settingsRow]);

  const { data: configs = [] } = useQuery<AiConfigRow[]>({
    queryKey: ["ai_config"],
    enabled: !checking,
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_config").select("feature, model, prompt");
      if (error) throw error;
      return (data ?? []) as AiConfigRow[];
    },
  });

  useEffect(() => {
    if (configs.length > 0) {
      const models: Record<string, string> = {};
      const prompts: Record<string, string> = {};
      configs.forEach((row) => {
        models[row.feature] = row.model;
        prompts[row.feature] = row.prompt ?? "";
      });
      setLocalModels(models);
      setLocalPrompts(prompts);
    }
  }, [configs]);

  const saveOpenrouterKeyMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      const { error } = await supabase
        .from("settings")
        .upsert({ key: OPENROUTER_SETTINGS_KEY, value: apiKey }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast("API key guardada ✓");
      await queryClient.invalidateQueries({ queryKey: ["settings", OPENROUTER_SETTINGS_KEY] });
    },
    onError: () => {
      toast("Error al guardar la API key");
    },
    onSettled: () => {
      setSavingOpenrouterKey(false);
    },
  });

  const handleSaveOpenrouterKey = () => {
    let toSave: string;
    if (openrouterKeyDirty) {
      toSave = openrouterKeyInput.trim();
    } else if (storedOpenrouterKey) {
      toSave = storedOpenrouterKey;
    } else {
      toSave = openrouterKeyInput.trim();
    }
    if (!toSave) {
      toast("Introduce una API key");
      return;
    }
    setSavingOpenrouterKey(true);
    saveOpenrouterKeyMutation.mutate(toSave, {
      onSuccess: () => {
        setStoredOpenrouterKey(toSave);
        setOpenrouterKeyInput(obfuscateApiKey(toSave));
        setOpenrouterKeyDirty(false);
      },
    });
  };

  const saveMutation = useMutation({
    mutationFn: async ({ feature, model, prompt }: { feature: string; model: string; prompt: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("ai_config").upsert(
        { feature, model, prompt: prompt || null, updated_by: userData.user?.id },
        { onConflict: "feature" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      setSavingFeature(null);
      toast("Modelo actualizado");
      await queryClient.invalidateQueries({ queryKey: ["ai_config"] });
    },
    onError: () => {
      setSavingFeature(null);
      toast("Error al guardar");
    },
  });

  const handleSave = (feature: string) => {
    const model = localModels[feature];
    if (!model) return;
    const prompt = localPrompts[feature] ?? "";
    setSavingFeature(feature);
    saveMutation.mutate({ feature, model, prompt });
  };

  const modelOptions = availableModels.length > 0 ? availableModels : FALLBACK_MODELS;

  const hasSavedOpenrouterKey = Boolean(storedOpenrouterKey);

  const handleLoadModels = async () => {
    const key = storedOpenrouterKey;
    if (!key) return;
    setLoadingModels(true);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { data?: { id: string; name?: string }[] };
      const arr = json.data ?? [];
      const list = arr.map((item) => ({
        id: item.id,
        name: item.name ?? item.id,
      }));
      setAvailableModels(list);
      toast(`${list.length} modelos cargados ✓`);
    } catch {
      toast("Error al cargar modelos");
    } finally {
      setLoadingModels(false);
    }
  };

  const onOpenrouterInputChange = (v: string) => {
    setOpenrouterKeyInput(v);
    setOpenrouterKeyDirty(true);
  };

  const displayOpenrouterValue = openrouterKeyDirty
    ? openrouterKeyInput
    : storedOpenrouterKey
      ? showOpenrouterKey
        ? storedOpenrouterKey
        : obfuscateApiKey(storedOpenrouterKey)
      : openrouterKeyInput;

  const openrouterInputType =
    openrouterKeyDirty && !showOpenrouterKey ? "password" : "text";

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C6017F] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Navbar */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#F2F2F2] bg-white">
        <div className="mx-auto flex h-16 w-full max-w-[480px] items-center justify-between px-4">
          <p className="text-xl font-bold lowercase tracking-tight text-[#C6017F]">fiestamas</p>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#717B99] hover:bg-[#FFF0F9] hover:text-[#C6017F]"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-[480px] px-4 pb-12 pt-24">
        <h1 className="text-2xl font-bold text-[#2E2D2C]">Panel de administración</h1>
        <p className="mt-1 text-sm text-[#717B99]">
          Configura el modelo de IA para cada feature
        </p>

        {/* OpenRouter */}
        <div className="mt-6 rounded-xl border border-[#E5E5E5] bg-white p-4">
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-[#2E2D2C]">OpenRouter</p>
            <span aria-hidden>🔑</span>
          </div>
          <p className="mt-1 text-sm text-[#717B99]">Tu API key para acceder a los modelos de IA</p>

          <div className="relative mt-3">
            <Input
              type={openrouterInputType}
              placeholder="sk-or-..."
              value={displayOpenrouterValue}
              onChange={(e) => onOpenrouterInputChange(e.target.value)}
              className="h-11 w-full rounded-[12px] border-[#E5E5E5] pr-11 text-sm focus-visible:border-[#C6017F] focus-visible:ring-[#C6017F]"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#717B99] hover:bg-[#F5F5F5]"
              onClick={() => setShowOpenrouterKey((s) => !s)}
              aria-label={showOpenrouterKey ? "Ocultar API key" : "Mostrar API key"}
            >
              {showOpenrouterKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Button
            type="button"
            disabled={savingOpenrouterKey || saveOpenrouterKeyMutation.isPending}
            onClick={handleSaveOpenrouterKey}
            className="mt-3 h-11 w-full rounded-[12px] bg-[#C6017F] text-white hover:bg-[#B10072]"
          >
            {savingOpenrouterKey || saveOpenrouterKeyMutation.isPending ? "Guardando..." : "Guardar key"}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={!hasSavedOpenrouterKey || loadingModels}
            onClick={() => void handleLoadModels()}
            className="mt-3 h-11 w-full rounded-[12px] border-[#E5E5E5] text-[#2E2D2C] hover:bg-[#FFF0F9]"
          >
            {loadingModels ? "Cargando..." : "Cargar modelos disponibles"}
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.key}
              className="rounded-xl border border-[#E5E5E5] bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{feature.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#2E2D2C]">{feature.title}</p>
                  <p className="mb-3 text-xs text-[#717B99]">{feature.desc}</p>

                  <Select
                    value={localModels[feature.key] ?? ""}
                    onValueChange={(val) =>
                      setLocalModels((prev) => ({ ...prev, [feature.key]: val }))
                    }
                  >
                    <SelectTrigger className="mb-3 h-10 w-full rounded-xl border-[#E5E5E5] text-sm focus:ring-1 focus:ring-[#C6017F]">
                      <SelectValue placeholder="Selecciona un modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Label htmlFor={`prompt-${feature.key}`} className="text-[12px] text-[#717B99]">
                    Prompt del sistema
                  </Label>
                  <Textarea
                    id={`prompt-${feature.key}`}
                    rows={4}
                    placeholder="Eres un asistente que sugiere regalos..."
                    value={localPrompts[feature.key] ?? ""}
                    onChange={(e) =>
                      setLocalPrompts((prev) => ({ ...prev, [feature.key]: e.target.value }))
                    }
                    className="mt-1 text-[13px] rounded-[12px] border-[#E5E5E5] focus-visible:border-[#C6017F] focus-visible:ring-[#C6017F]"
                  />

                  <Button
                    size="sm"
                    disabled={savingFeature === feature.key || !localModels[feature.key]}
                    onClick={() => handleSave(feature.key)}
                    className="mt-3 rounded-xl bg-[#C6017F] px-4 text-white hover:bg-[#B10072]"
                  >
                    {savingFeature === feature.key ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const Admin = () => (
  <QueryClientProvider client={adminQueryClient}>
    <AdminContent />
  </QueryClientProvider>
);

export default Admin;
