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

  const digits = phone.replace(/\D/g, "");
  // Build full number with country code
  let fullNumber = digits.startsWith("55") && digits.length >= 12
    ? digits
    : "55" + digits;
  // Fonnte needs 12-digit format: strip the 9th-digit prefix added to Brazilian mobiles
  // e.g. 5537991461867 (13) → 553791461867 (12)
  if (fullNumber.length === 13 && fullNumber.startsWith("55")) {
    const afterDDD = fullNumber.slice(4); // digits after country+DDD
    if (afterDDD.startsWith("9") && afterDDD.length === 9) {
      fullNumber = fullNumber.slice(0, 4) + afterDDD.slice(1);
    }
  }
  const localNumber = fullNumber.slice(2); // strip 55 for target param

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { "Authorization": token },
      body: new URLSearchParams({ target: localNumber, message: text, countryCode: "55" }),
    });
    const body = await res.text().catch(() => "");
    console.log(`[WhatsApp] ${res.status} target=${localNumber}:`, body.slice(0, 200));
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
