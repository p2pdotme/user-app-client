import ASSETS from "@/assets";

export function TextLogo() {
  return (
    <div className="flex items-center gap-1">
      <ASSETS.ICONS.Logo className="size-6 text-primary" />
      <h1 className="font-bold text-lg">P2P.ME</h1>
    </div>
  );
}
