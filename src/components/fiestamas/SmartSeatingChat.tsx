import { useState, useRef, useEffect } from "react";
import { Loader2, Send, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { type SeatingGuest } from "@/hooks/useSeating";
import { useContacts } from "@/hooks/useContacts";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ExtractedGuest = {
  name: string;
  group_tag: string | null;
  age_approx: number | null;
  is_single: boolean | null;
  comes_with_partner: boolean;
  notes: string | null;
};

type UserContact = {
  name: string;
  phone: string | null;
  interests: string | null;
};

type Props = {
  eventId: string;
  eventName: string;
  existingGuests: SeatingGuest[];
  onGuestsExtracted: (guests: ExtractedGuest[]) => void;
  onChatComplete: () => void;
};

function buildSystemPrompt(contacts: UserContact[], eventName: string): string {
  const contactsBlock = contacts.length > 0
    ? `\n\nCONTACTOS DEL USUARIO EN SU AGENDA (${contacts.length} personas):\n${contacts
        .map(c => {
          const parts = [`- ${c.name}`];
          if (c.interests) parts.push(`(gustos: ${c.interests})`);
          return parts.join(" ");
        })
        .join("\n")}\n\nUSA ESTOS NOMBRES REALES en tus preguntas. Por ejemplo: "Oye, veo que tienes a ${contacts[0]?.name ?? "alguien"} en tu agenda, ¿va al evento?". No inventes nombres nuevos — trabaja con esta lista.`
    : "";

  return `Eres el asistente de Smart Seating de Fiestamas. Tu trabajo es ayudar al organizador a distribuir a sus invitados en mesas para "${eventName}", de forma conversacional y natural — como una plática entre amigos, no un interrogatorio.

OBJETIVO SECRETO: Mientras platicas, construyes un grafo social de los invitados. Por cada persona necesitas inferir silenciosamente:
- Su grupo de pertenencia (familia, trabajo, amigos_novio, amigos_novia, hobby, pareja, otro)
- Edad aproximada
- Si va solo/a o en pareja
- Relaciones positivas o tensiones con otros invitados

REGLAS DE CONVERSACIÓN:
1. Si tienes la lista de contactos del usuario, empieza mencionando que ya los tienes y pregunta cuáles van al evento
2. Haz UNA sola pregunta a la vez, de forma casual y con humor mexicano
3. Referencia nombres reales: "¿Y ${contacts[1]?.name ?? "tu amigo"} viene con pareja o va solo/a?"
4. Después de 5-8 mensajes, ofrece generar el borrador de mesas
5. Nunca menciones "grafo", "algoritmo" ni términos técnicos
6. Si alguien no está en la lista de contactos pero el usuario lo menciona, agrégalo al JSON igual
7. Sé curioso sobre tensiones: "Oye, ¿Carlos e Itzel se llevan bien o mejor los separo?" 😏

CUANDO EL USUARIO DIGA QUE ESTÁ LISTO O PIDA VER LAS MESAS:
Responde SOLAMENTE con este JSON exacto, sin texto antes ni después, sin markdown, sin backticks:
{
  "ready": true,
  "guests": [
    {
      "name": "Nombre Completo",
      "group_tag": "familia",
      "age_approx": 28,
      "is_single": true,
      "comes_with_partner": false,
      "notes": "Prima del novio, muy sociable"
    }
  ],
  "relations": [
    {
      "guest_a": "Carlos",
      "guest_b": "Itzel",
      "type": "tension",
      "strength": 2,
      "notes": "Problema laboral en proyecto DP"
    }
  ]
}

Los valores válidos para group_tag son: familia, trabajo, amigos_novio, amigos_novia, hobby, pareja, otro
Los valores válidos para relation type son: tension, afinidad, pareja, familia, compañeros

Si el usuario solo está platicando, responde SOLO con texto conversacional, sin JSON.${contactsBlock}`;
}

export function SmartSeatingChat({ eventId, eventName, existingGuests, onGuestsExtracted, onChatComplete }: Props) {
  const { orderedContacts = [] } = useContacts();

  const userContacts: UserContact[] = orderedContacts.map(c => ({
    name: c.name,
    phone: c.phone,
    interests: c.interests,
  }));

  const initialMessage = userContacts.length > 0
    ? `¡Hola! Vamos a armar el layout de mesas para **${eventName}** 🎉\n\nVeo que tienes **${userContacts.length} contactos** en tu agenda. ¿Cuáles de ellos vienen al evento? Puedes decirme sus nombres o decirme "todos" si vienen todos.`
    : `¡Hola! Vamos a armar el layout de mesas para **${eventName}** 🎉\n\n¿Cuántas personas vienen aproximadamente? ¿Y de qué tipo de evento se trata — boda, cumple, XV años?`;

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: initialMessage },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data: settingsRow } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "openrouter_api_key")
        .maybeSingle();

      const apiKey = settingsRow?.value as string | undefined;
      if (!apiKey) throw new Error("Sin API key");

      const existingNote = existingGuests.length > 0
        ? `\n\n[YA REGISTRADOS EN ESTE EVENTO: ${existingGuests.map(g => g.name).join(", ")}]`
        : "";

      const systemPrompt = buildSystemPrompt(userContacts, eventName) + existingNote;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-exp:free",
          messages: [
            { role: "system", content: systemPrompt },
            ...newMessages.map(m => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 1500,
          temperature: 0.8,
        }),
      });

      const json = await response.json() as {
        choices?: { message?: { content?: string } }[];
        error?: { message?: string };
      };

      const raw = json.choices?.[0]?.message?.content ?? "";

      const jsonMatch = raw.match(/\{[\s\S]*?"ready"\s*:\s*true[\s\S]*?\}/);
      if (jsonMatch) {
        setIsProcessing(true);
        try {
          const parsed = JSON.parse(jsonMatch[0]) as {
            ready: boolean;
            guests: ExtractedGuest[];
            relations: unknown[];
          };
          if (parsed.ready && parsed.guests?.length > 0) {
            setMessages(prev => [...prev, {
              role: "assistant",
              content: `¡Perfecto! Identifiqué **${parsed.guests.length} invitados** y sus conexiones. Generando el layout inteligente de mesas... 🎯`,
            }]);
            onGuestsExtracted(parsed.guests);
            setTimeout(() => onChatComplete(), 1500);
            return;
          }
        } catch {
          // JSON inválido, tratar como texto normal
        } finally {
          setIsProcessing(false);
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: raw }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Ups, tuve un problema de conexión. ¿Puedes repetir eso?",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const quickSuggestions = userContacts.length > 0
    ? [
        "Vienen todos mis contactos",
        `Vienen ${Math.min(userContacts.length, 20)} personas`,
        "Te digo quién viene",
        "Genera el layout 🎯",
      ]
    : [
        "Somos como 50 personas",
        "Es una boda",
        "Ya tengo la lista completa",
        "Genera el layout 🎯",
      ];

  void eventId;

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Contacts awareness chip */}
      {userContacts.length > 0 && (
        <div className="px-4 pt-3 pb-1 shrink-0">
          <div className="flex items-center gap-2 rounded-xl bg-[#F5F0FD] border border-[#C8C0F0] px-3 py-2">
            <Users className="h-3.5 w-3.5 text-[#5221D6] shrink-0" />
            <p className="text-[11.5px] text-[#5221D6] font-medium">
              La IA conoce tus <strong>{userContacts.length} contactos</strong> — solo dile quiénes vienen
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C6017F] text-[10px] font-bold text-white mr-2 mt-1">
                fm
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#5221D6] text-white rounded-br-sm"
                  : "bg-white border border-[#F2F2F2] text-[#2E2D2C] rounded-bl-sm shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
              }`}
              dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\n/g, "<br/>"),
              }}
            />
          </div>
        ))}

        {(isLoading || isProcessing) && (
          <div className="flex justify-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C6017F] text-[10px] font-bold text-white mr-2">
              fm
            </div>
            <div className="bg-white border border-[#F2F2F2] rounded-2xl rounded-bl-sm px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <Loader2 className="h-4 w-4 animate-spin text-[#C6017F]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      <div className="px-4 pb-2 flex gap-2 flex-wrap shrink-0">
        {quickSuggestions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setInput(q)}
            className="text-[11px] rounded-full border border-[#C6017F] px-2.5 py-1 text-[#C6017F] bg-white hover:bg-[#FFF0F9] transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-1 shrink-0">
        <div className="flex items-end gap-2 rounded-2xl border border-[#E5E5E5] bg-white px-3 py-2 focus-within:border-[#C6017F] transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe aquí..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-[13.5px] text-[#2E2D2C] placeholder:text-[#A1A1A0] outline-none"
            style={{ maxHeight: "80px" }}
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C6017F] text-white disabled:opacity-40 transition-opacity"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
