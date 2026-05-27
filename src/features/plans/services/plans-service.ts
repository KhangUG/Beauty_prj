import { supabase } from "@/services/supabase/client";

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  billing_interval: string;
  scan_limit: number;
  history_days: number;
  description: string | null;
  features: string[];
  badge: string | null;
  is_active: boolean;
}

export const plansService = {
  async getActivePlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
