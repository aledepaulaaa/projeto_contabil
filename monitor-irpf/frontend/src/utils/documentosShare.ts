export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

export function buildWhatsAppUrl(telefone: string | null | undefined, portalUrl: string, nomeCliente: string): string {
  const msg = `Olá${nomeCliente ? ` ${nomeCliente.split(/\s+/)[0]}` : ""}! Para enviar os documentos da sua declaração de IRPF, acesse o link: ${portalUrl}`;
  const text = encodeURIComponent(msg);
  const digits = (telefone || "").replace(/\D/g, "");
  if (digits.length >= 10) {
    const wa = digits.startsWith("55") ? digits : `55${digits}`;
    return `https://wa.me/${wa}?text=${text}`;
  }
  return `https://wa.me/?text=${text}`;
}
