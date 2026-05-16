const TIMEZONE = "America/Sao_Paulo";

function formatBRPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.startsWith("0")) return "55" + digits.slice(1);
  return "55" + digits;
}

export async function sendWhatsApp(phone: string, text: string): Promise<void> {
  const token = process.env.FONNTE_TOKEN;

  if (!token) {
    console.warn("[WhatsApp] FONNTE_TOKEN not set — skipping notification");
    return;
  }
  if (!phone) return;

  const number = formatBRPhone(phone);
  console.log("[WhatsApp] Sending to:", number);

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": token,
      },
      body: new URLSearchParams({
        target: number,
        message: text,
      }),
    });
    const body = await res.text().catch(() => "");
    console.log(`[WhatsApp] Fonnte response ${res.status}:`, body.slice(0, 200));
  } catch (err) {
    console.error("[WhatsApp] Network error:", err);
  }
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}
