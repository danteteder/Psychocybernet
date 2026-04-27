"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Goal, Business, Task } from "@/shared/db/types";

// Hook: fetch goals for a given year, optionally filtered by quarter
export function useGoals(year: number, quarter?: number) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);

    let query = supabase
      .from("goals")
      .select("*")
      .eq("year", year)
      .order("quarter", { ascending: true });

    if (quarter) {
      query = query.eq("quarter", quarter);
    }

    const { data } = await query;
    if (data) setGoals(data as Goal[]);
    setLoading(false);
  }, [year, quarter]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return { goals, loading, refetch: fetchGoals };
}

// Hook: CRUD for goals
export function useGoalActions(onSuccess?: () => void) {
  const supabase = createClient();

  const addGoal = useCallback(
    async (goal: {
      title: string;
      description?: string;
      business_id?: string;
      quarter: number;
      year: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("goals").insert({
        ...goal,
        owner_id: user.id,
        status: "active",
      });

      onSuccess?.();
    },
    [supabase, onSuccess]
  );

  const updateGoal = useCallback(
    async (id: string, updates: Partial<Goal>) => {
      await supabase.from("goals").update(updates).eq("id", id);
      onSuccess?.();
    },
    [supabase, onSuccess]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      await supabase.from("goals").delete().eq("id", id);
      onSuccess?.();
    },
    [supabase, onSuccess]
  );

  return { addGoal, updateGoal, deleteGoal };
}

// Hook: fetch task counts per day for a month (for the month grid heatmap)
export function useMonthTaskDensity(year: number, month: number) {
  const [density, setDensity] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      // Get last day of month
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

      const { data } = await supabase
        .from("tasks")
        .select("scheduled_date")
        .gte("scheduled_date", startDate)
        .lte("scheduled_date", endDate);

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((t) => {
          if (t.scheduled_date) {
            counts[t.scheduled_date] = (counts[t.scheduled_date] || 0) + 1;
          }
        });
        setDensity(counts);
      }
    }
    fetch();
  }, [year, month]);

  return density;
}

// Hook: businesses list (re-exported for convenience in goals module)
export function useBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase.from("businesses").select("*").order("name");
      if (data) setBusinesses(data as Business[]);
    }
    fetch();
  }, []);

  return businesses;
}
