export function shareData(hash: string): string | null {
  const parts = hash.replace(/^#/, "").split("&");
  const data = parts.filter((part) => part.startsWith("p="));
  if (data.length > 1) return "";
  return data[0]?.slice(2) ?? null;
}

export function clearShareData(href: string): string {
  const url = new URL(href);
  url.hash = url.hash.slice(1).split("&").filter((part) => !part.startsWith("p=")).join("&");
  return url.href;
}

export function shareUrl(href: string, encoded: string): string {
  const url = new URL(clearShareData(href));
  url.pathname = "/";
  url.searchParams.delete("view");
  url.searchParams.delete("plan");
  url.hash = `${url.hash ? `${url.hash.slice(1)}&` : ""}p=${encoded}`;
  return url.href;
}
