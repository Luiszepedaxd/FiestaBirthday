import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type SeatingEvent = {
  id: string;
  user_id: string;
  name: string;
  event_date: string | null;
  tables_count: number;
  seats_per_table: number;
  created_at: string;
};

export type SeatingGuest = {
  id: string;
  event_id: string;
  user_id: string;
  name: string;
  group_tag: string | null;
  age_approx: number | null;
  is_single: boolean | null;
  comes_with_partner: boolean;
  notes: string | null;
  table_number: number | null;
  seat_position: number | null;
};

export type SeatingRelation = {
  id: string;
  event_id: string;
  guest_a_id: string;
  guest_b_id: string;
  relation_type: "tension" | "afinidad" | "pareja" | "familia" | "compañeros";
  strength: number;
  notes: string | null;
};

export const useSeatingEvents = () => {
  return useQuery({
    queryKey: ["seating_events"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as SeatingEvent[];
      const { data, error } = await supabase
        .from("seating_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SeatingEvent[];
    },
  });
};

export const useSeatingGuests = (eventId: string | null) => {
  return useQuery({
    queryKey: ["seating_guests", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (!eventId) return [] as SeatingGuest[];
      const { data, error } = await supabase
        .from("seating_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("table_number", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as SeatingGuest[];
    },
  });
};

export const useUpdateGuestTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ guestId, tableNumber, eventId }: { guestId: string; tableNumber: number | null; eventId: string }) => {
      const { error } = await supabase
        .from("seating_guests")
        .update({ table_number: tableNumber })
        .eq("id", guestId);
      if (error) throw error;
      return { eventId };
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["seating_guests", vars.eventId] });
    },
  });
};

export const useUpsertGuests = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ guests, eventId }: { guests: Omit<SeatingGuest, "id" | "created_at">[]; eventId: string }) => {
      const { error } = await supabase.from("seating_guests").insert(guests);
      if (error) throw error;
      return eventId;
    },
    onSuccess: (eventId) => {
      void queryClient.invalidateQueries({ queryKey: ["seating_guests", eventId] });
    },
  });
};

export const useCreateSeatingEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; tables_count: number; seats_per_table: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const { data, error } = await supabase
        .from("seating_events")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as SeatingEvent;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seating_events"] });
    },
  });
};
