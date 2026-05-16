const TIMEZONE = "America/Sao_Paulo";

function formatBRPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.startsWith("0")) return "55" + digits.slice(1);
  return "55" + digits;
}

export async function sendWhatsApp(phone: string, text: string): Promise<void> {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instanceId || !token) {
    console.warn("[WhatsApp] ZAPI env vars not set — skipping notification");
    return;
  }
  if (!phone) {
    console.warn("[WhatsApp] No phone number — skipping notification");
    return;
  }

  const number = formatBRPhone(phone);
  console.log("[WhatsApp] Sending to:", number);

  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Client-Token": clientToken ?? "",
        },
        body: JSON.stringify({ phone: number, message: text }),
      }
    );
    const body = await res.text().catch(() => "");
    if (!res.ok) {
      console.error(`[WhatsApp] Z-API error ${res.status}:`, body);
    } else {
      console.log(`[WhatsApp] Sent OK ${res.status}:`, body.slice(0, 100));
    }
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
