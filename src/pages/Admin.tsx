import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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

const MODELS = [
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini (rápido)" },
  { value: "openai/gpt-4o", label: "GPT-4o (potente)" },
  { value: "anthropic/claude-3-haiku", label: "Claude 3 Haiku" },
  { value: "anthropic/claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "meta-llama/llama-3.1-8b-instruct", label: "Llama 3.1 8B (económico)" },
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
};

const adminQueryClient = new QueryClient();

const AdminContent = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [checking, setChecking] = useState(true);
  const [localModels, setLocalModels] = useState<Record<string, string>>({});
  const [savingFeature, setSavingFeature] = useState<string | null>(null);

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

  const { data: configs = [] } = useQuery<AiConfigRow[]>({
    queryKey: ["ai_config"],
    enabled: !checking,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_config")
        .select("feature, model");
      if (error) throw error;
      return (data ?? []) as AiConfigRow[];
    },
  });

  useEffect(() => {
    if (configs.length > 0) {
      const map: Record<string, string> = {};
      configs.forEach((row) => { map[row.feature] = row.model; });
      setLocalModels(map);
    }
  }, [configs]);

  const saveMutation = useMutation({
    mutationFn: async ({ feature, model }: { feature: string; model: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("ai_config")
        .upsert({ feature, model, updated_by: userData.user?.id }, { onConflict: "feature" });
      if (error) throw error;
    },
    onSuccess: async (_data, variables) => {
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
    setSavingFeature(feature);
    saveMutation.mutate({ feature, model });
  };

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
                      {MODELS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    disabled={savingFeature === feature.key || !localModels[feature.key]}
                    onClick={() => handleSave(feature.key)}
                    className="rounded-xl bg-[#C6017F] px-4 text-white hover:bg-[#B10072]"
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
