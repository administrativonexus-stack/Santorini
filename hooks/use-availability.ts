"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DayOfWeek } from "@/types/database";

const JS_TO_DB_DAY: Record<number, DayOfWeek> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const min = (m % 60).toString().padStart(2, "0");
  return `${h}:${min}`;
}

export function useAvailability() {
  const supabase = createClient();
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchSlots = useCallback(
    async (barberId: string, durationMinutes: number, date: Date) => {
      setLoadingSlots(true);
      setSlots([]);

      const dayKey = JS_TO_DB_DAY[date.getDay()];
      const dateStr = date.toISOString().split("T")[0];
      const dayStart = `${dateStr}T00:00:00`;
      const dayEnd = `${dateStr}T23:59:59`;

      const [{ data: wh }, { data: existing }, { data: blocks }] =
        await Promise.all([
          supabase
            .from("working_hours")
            .select("start_time, end_time")
            .eq("barber_id", barberId)
            .eq("day", dayKey)
            .eq("is_active", true)
            .maybeSingle(),

          supabase
            .from("appointments")
            .select("scheduled_at, ends_at")
            .eq("barber_id", barberId)
            .gte("scheduled_at", dayStart)
            .lte("scheduled_at", dayEnd)
            .in("status", ["pending", "confirmed", "in_progress"]),

          supabase
            .from("time_blocks")
            .select("start_at, end_at")
            .eq("barber_id", barberId)
            .gte("start_at", dayStart)
            .lte("start_at", dayEnd),
        ]);

      if (!wh) {
        setLoadingSlots(false);
        return;
      }

      const startMin = timeToMinutes(wh.start_time);
      const endMin = timeToMinutes(wh.end_time);

      // Busy intervals in minutes-from-midnight
      const busy: { start: number; end: number }[] = [];

      (existing ?? []).forEach((apt) => {
        const s = new Date(apt.scheduled_at);
        const e = new Date(apt.ends_at);
        busy.push({
          start: s.getHours() * 60 + s.getMinutes(),
          end: e.getHours() * 60 + e.getMinutes(),
        });
      });

      (blocks ?? []).forEach((blk) => {
        const s = new Date(blk.start_at);
        const e = new Date(blk.end_at);
        busy.push({
          start: s.getHours() * 60 + s.getMinutes(),
          end: e.getHours() * 60 + e.getMinutes(),
        });
      });

      const available: string[] = [];
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const nowMin = isToday ? now.getHours() * 60 + now.getMinutes() + 30 : 0;

      for (let t = startMin; t + durationMinutes <= endMin; t += durationMinutes) {
        if (t < nowMin) continue;
        const slotEnd = t + durationMinutes;
        const overlaps = busy.some((b) => t < b.end && slotEnd > b.start);
        if (!overlaps) {
          available.push(minutesToTime(t));
        }
      }

      setSlots(available);
      setLoadingSlots(false);
    },
    [supabase]
  );

  return { slots, loadingSlots, fetchSlots };
}
