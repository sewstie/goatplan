import { FileCode } from "@phosphor-icons/react/ssr";

export function FileCard({ name, text }: { name: string; text: string }) {
  return (
    <div className="flex items-center gap-14 rounded-card border border-card-line bg-canvas px-17 py-17">
      <FileCode aria-hidden className="size-26 shrink-0" />
      <div className="min-w-0">
        <p className="truncate text-8-5 leading-17 font-600">{name}</p>
        <p className="pt-2 text-8 leading-14-4 text-ink-muted">{text}</p>
      </div>
    </div>
  );
}
