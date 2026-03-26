import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";
import { type Contact, useContacts } from "@/hooks/useContacts";

const dashboardQueryClient = new QueryClient();

const contactSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  birthday: z.string().min(1, "La fecha de cumpleaños es obligatoria"),
  phone: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;
type FormMode = "create" | "edit";

const formatBirthday = (birthday: string) =>
  new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" }).format(new Date(birthday));

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const formatDaysBadge = (days: number) => {
  if (days === 1) return "en 1 día";
  return `en ${days} días`;
};

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

type ContactCardProps = {
  contact: Contact;
  days: number;
  badgeBg: string;
  badgeText: string;
  badgeLabel: string;
  avatarBg: string;
  onAction: () => void;
};

const ContactCard = ({ contact, badgeBg, badgeText, badgeLabel, avatarBg, onAction }: ContactCardProps) => (
  <div className="flex items-center gap-3 rounded-2xl border border-[#F2F2F2] bg-white p-4">
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: avatarBg }}
    >
      {getInitials(contact.name)}
    </div>

    <div className="min-w-0 flex-1">
      <p className="truncate font-bold text-[#2E2D2C]">{contact.name}</p>
      <p className="text-xs text-[#717B99]">{formatBirthday(contact.birthday)}</p>
      <span
        className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ backgroundColor: badgeBg, color: badgeText }}
      >
        {badgeLabel}
      </span>
    </div>

    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onAction}
        className="rounded-full border border-[#C6017F] px-3 py-1 text-xs font-semibold text-[#C6017F] hover:bg-[#FFF0F9]"
      >
        Felicitar 🎉
      </button>
      <button
        type="button"
        onClick={onAction}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#717B99] hover:bg-[#F5F5F5]"
      >
        <MoreHorizontal size={18} />
      </button>
    </div>
  </div>
);

const DashboardContent = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoading, isError, error, orderedContacts } = useContacts();

  const now = new Date();
  const currentMonth = now.getMonth();

  const todayContacts = orderedContacts.filter((c) => getDaysUntil(c.birthday) === 0);
  const thisMonthContacts = orderedContacts.filter((c) => {
    const days = getDaysUntil(c.birthday);
    const parsed = new Date(c.birthday);
    return days > 0 && parsed.getMonth() === currentMonth;
  });
  const upcomingContacts = orderedContacts.filter((c) => {
    const days = getDaysUntil(c.birthday);
    const parsed = new Date(c.birthday);
    return days > 0 && parsed.getMonth() !== currentMonth;
  });
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [isActionsDrawerOpen, setIsActionsDrawerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      birthday: "",
      phone: "",
    },
  });

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
        birthday: values.birthday,
        phone: values.phone?.trim() || null,
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
      setIsFormDrawerOpen(false);
      setSelectedContact(null);
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
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
    onSuccess: async () => {
      setIsActionsDrawerOpen(false);
      setSelectedContact(null);
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const openCreateDrawer = () => {
    setSubmitError(null);
    setFormMode("create");
    setSelectedContact(null);
    form.reset({ name: "", birthday: "", phone: "" });
    setIsFormDrawerOpen(true);
  };

  const openEditDrawer = () => {
    if (!selectedContact) return;
    setSubmitError(null);
    setFormMode("edit");
    form.reset({
      name: selectedContact.name,
      birthday: selectedContact.birthday,
      phone: selectedContact.phone ?? "",
    });
    setIsActionsDrawerOpen(false);
    setIsFormDrawerOpen(true);
  };

  const onSubmit = (values: ContactFormValues) => {
    setSubmitError(null);
    saveContactMutation.mutate(values);
  };

  return (
    <div
      className="min-h-screen bg-[#FFFFFF] text-[#2E2D2C]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#F2F2F2] bg-white">
        <div className="mx-auto flex h-16 w-full max-w-[480px] items-center justify-between px-4">
          <p className="text-xl font-bold lowercase tracking-tight text-[#C6017F]">fiestamas</p>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#717B99] hover:bg-[#FFF0F9] hover:text-[#C6017F]"
            onClick={handleSignOut}
          >
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[480px] space-y-6 px-4 pb-24 pt-20">
        {isLoading && (
          <section className="space-y-3">
            <Skeleton className="h-[220px] w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </section>
        )}

        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            Error al cargar contactos: {error instanceof Error ? error.message : "Error desconocido"}
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {orderedContacts.length > 0 && (() => {
              const heroContact = todayBirthdays.length > 0 ? todayBirthdays[0] : orderedContacts[0];
              const isToday = todayBirthdays.length > 0;
              const days = heroContact.daysUntilBirthday;
              const badgeLabel = isToday ? "Hoy 🎂" : `En ${days} día${days === 1 ? "" : "s"} 🎂`;
              return (
                <section>
                  <div className="relative overflow-hidden rounded-2xl" style={{ height: 280 }}>
                    <img
                      src="/birthday-hero.jpg"
                      alt="Cumpleaños"
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/10" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <span
                        className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: isToday ? "#C6017F" : "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}
                      >
                        {badgeLabel}
                      </span>
                      <p className="text-[32px] font-bold leading-tight text-white">{heroContact.name}</p>
                      <button
                        type="button"
                        onClick={() => console.log("felicitar", heroContact)}
                        className="mt-3 font-semibold text-white"
                        style={{
                          backgroundColor: "#C6017F",
                          borderRadius: 24,
                          padding: "12px 32px",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Felicitar 🎉
                      </button>
                    </div>
                  </div>
                </section>
              );
            })()}

            {todayContacts.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-bold text-[#2E2D2C]">Hoy 🎂</h2>
                <div className="space-y-3">
                  {todayContacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      days={0}
                      badgeBg="#C6017F"
                      badgeText="white"
                      badgeLabel="¡Hoy!"
                      avatarBg="#C6017F"
                      onAction={() => { setSelectedContact(contact); setIsActionsDrawerOpen(true); }}
                    />
                  ))}
                </div>
              </section>
            )}

            {thisMonthContacts.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-bold text-[#2E2D2C]">Este mes 🎉</h2>
                <div className="space-y-3">
                  {thisMonthContacts.map((contact) => {
                    const days = getDaysUntil(contact.birthday);
                    return (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        days={days}
                        badgeBg="#FFF0F9"
                        badgeText="#C6017F"
                        badgeLabel={`en ${days} día${days === 1 ? "" : "s"}`}
                        avatarBg="#C6017F"
                        onAction={() => { setSelectedContact(contact); setIsActionsDrawerOpen(true); }}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {upcomingContacts.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-bold text-[#2E2D2C]">Próximos 📅</h2>
                <div className="space-y-3">
                  {upcomingContacts.map((contact) => {
                    const days = getDaysUntil(contact.birthday);
                    return (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        days={days}
                        badgeBg="#F5F5F5"
                        badgeText="#717B99"
                        badgeLabel={`en ${days} día${days === 1 ? "" : "s"}`}
                        avatarBg="#C6017F"
                        onAction={() => { setSelectedContact(contact); setIsActionsDrawerOpen(true); }}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[#2E2D2C]">Tus contactos</h2>
              {orderedContacts.length === 0 ? (
                <p className="rounded-2xl bg-[#FAFAFA] p-5 text-sm text-[#717B99]">
                  Aún no tienes contactos, agrega el primero 👇
                </p>
              ) : (
                <div className="rounded-2xl border border-[#F2F2F2] bg-white">
                  {orderedContacts.map((contact) => (
                    <button
                      type="button"
                      key={contact.id}
                      onClick={() => {
                        setSelectedContact(contact);
                        setIsActionsDrawerOpen(true);
                      }}
                      className="flex w-full items-center gap-3 border-b border-[#F2F2F2] p-4 text-left last:border-b-0"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#5221D6] text-sm font-bold text-white">
                        {getInitials(contact.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#2E2D2C]">{contact.name}</p>
                        <p className="truncate text-xs text-[#717B99]">{contact.phone || "Sin teléfono"}</p>
                        <p className="text-xs text-[#717B99]">{formatBirthday(contact.birthday)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Button
        size="icon"
        className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full bg-[#C6017F] text-3xl text-white shadow-[0_4px_20px_rgba(198,1,127,0.4)] hover:bg-[#B10072]"
        onClick={openCreateDrawer}
      >
        +
      </Button>

      <Drawer open={isFormDrawerOpen} onOpenChange={setIsFormDrawerOpen}>
        <DrawerContent className="rounded-t-2xl">
          <DrawerHeader>
            <DrawerTitle className="font-bold text-[#2E2D2C]">
              {formMode === "create" ? "Nuevo contacto" : "Editar contacto"}
            </DrawerTitle>
            <DrawerDescription className="text-[#717B99]">
              {formMode === "create"
                ? "Completa los datos para guardar el contacto."
                : "Actualiza la información del contacto seleccionado."}
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#2E2D2C]">
                Nombre
              </Label>
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
              <Label htmlFor="birthday" className="text-[#2E2D2C]">
                Fecha de cumpleaños
              </Label>
              <Input
                id="birthday"
                type="date"
                className="h-12 rounded-xl border-[#E5E5E5] focus-visible:ring-1 focus-visible:ring-[#C6017F]"
                {...form.register("birthday")}
              />
              {form.formState.errors.birthday && (
                <p className="text-sm text-destructive">{form.formState.errors.birthday.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[#2E2D2C]">
                Teléfono (opcional)
              </Label>
              <Input
                id="phone"
                className="h-12 rounded-xl border-[#E5E5E5] focus-visible:ring-1 focus-visible:ring-[#C6017F]"
                {...form.register("phone")}
              />
            </div>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <DrawerFooter className="px-0 pb-0">
              <Button
                type="submit"
                disabled={saveContactMutation.isPending}
                className="h-12 w-full rounded-xl bg-[#C6017F] text-white hover:bg-[#B10072]"
              >
                {saveContactMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      <Drawer open={isActionsDrawerOpen} onOpenChange={setIsActionsDrawerOpen}>
        <DrawerContent className="rounded-t-2xl">
          <DrawerHeader>
            <DrawerTitle className="font-bold text-[#2E2D2C]">{selectedContact?.name}</DrawerTitle>
            <DrawerDescription className="text-[#717B99]">
              Selecciona una acción para este contacto.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <p className="px-1 text-xs font-semibold uppercase tracking-widest text-[#717B99]">
              Acciones
            </p>

            <Button
              type="button"
              className="w-full border border-[#C6017F] bg-white text-[#C6017F] hover:bg-[#FFF0F9]"
              variant="outline"
              onClick={() => {
                if (!selectedContact?.phone) {
                  toast("Este contacto no tiene teléfono guardado");
                  return;
                }
                const phone = selectedContact.phone.replace(/[\s\-]/g, "");
                const name = encodeURIComponent(selectedContact.name);
                window.open(
                  `https://wa.me/52${phone}?text=¡Hola%20${name}!%20🎂%20¡Feliz%20cumpleaños!%20Espero%20que%20tengas%20un%20día%20increíble%20🎉`,
                  "_blank",
                );
              }}
            >
              Felicitar por WhatsApp 💬
            </Button>

            <Button
              type="button"
              className="w-full border border-[#5221D6] bg-white text-[#5221D6] hover:bg-[#F3F0FF]"
              variant="outline"
              onClick={() => toast("Próximamente — sugerencias con IA")}
            >
              Sugerir regalo 🎁
            </Button>

            <Button
              type="button"
              className="w-full border border-[#C6017F] bg-white text-[#C6017F] hover:bg-[#FFF0F9]"
              variant="outline"
              onClick={() => window.open("https://fiestamas.com/c", "_blank")}
            >
              Organizar fiesta 🎉
            </Button>

            <div className="my-1 h-px w-full bg-[#F2F2F2]" />

            <Button type="button" onClick={openEditDrawer}>
              Editar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!selectedContact || deleteContactMutation.isPending}
              onClick={() => {
                if (!selectedContact) return;
                deleteContactMutation.mutate(selectedContact.id);
              }}
            >
              {deleteContactMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button">
                Cerrar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

const Dashboard = () => (
  <QueryClientProvider client={dashboardQueryClient}>
    <DashboardContent />
  </QueryClientProvider>
);

export default Dashboard;
