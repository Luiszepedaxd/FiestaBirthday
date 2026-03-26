import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const DashboardContent = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoading, isError, error, todayBirthdays, upcomingWeekBirthdays, orderedContacts } = useContacts();
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
            {todayBirthdays.length > 0 && (
              <section>
                {todayBirthdays.map((contact) => (
                  <div
                    key={contact.id}
                    className="relative h-[220px] overflow-hidden rounded-2xl"
                  >
                    <img
                      src="/birthday-hero.jpg"
                      alt="Cumpleaños del día"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/10" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <p className="text-sm font-medium text-white/80">Hoy es el día de</p>
                      <p className="mt-1 text-[28px] font-bold leading-tight">{contact.name}</p>
                    </div>
                  </div>
                ))}
              </section>
            )}

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[#2E2D2C]">Esta semana 🎂</h2>
              {upcomingWeekBirthdays.length === 0 ? (
                <p className="rounded-2xl bg-[#FAFAFA] p-5 text-center text-sm text-[#717B99]">
                  Nadie cumple esta semana 🎉
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingWeekBirthdays.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between rounded-2xl border border-[#F2F2F2] bg-white p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#C6017F] text-sm font-bold text-white">
                          {getInitials(contact.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-[#2E2D2C]">{contact.name}</p>
                          <p className="text-xs text-[#717B99]">{formatBirthday(contact.birthday)}</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#FFF0F9] px-3 py-1 text-xs font-semibold text-[#C6017F]">
                        {formatDaysBadge(contact.daysUntilBirthday)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

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
