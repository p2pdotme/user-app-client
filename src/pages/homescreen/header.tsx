import { Code, Menu } from "lucide-react";
import { useNavigate } from "react-router";
import { InstallPWAButton, Sidebar, TextLogo } from "@/components";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts";
import { INTERNAL_HREFS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Header() {
  const navigate = useNavigate();
  const {
    settings: { devMode },
  } = useSettings();

  return (
    <header className="sticky top-0 z-50 flex w-full flex-col items-center justify-between bg-sidebar pt-4 shadow-md shadow-primary/10">
      <div
        className={cn(
          "flex w-full max-w-xl items-center justify-between gap-2 px-4 xl:px-0",
          devMode ? "pb-2" : "pb-4",
        )}>
        <div className="flex items-center gap-4">
          <Sidebar>
            <Menu className="size-4" />
          </Sidebar>
          <TextLogo />
        </div>
        <div className="flex items-center gap-2">
          {devMode ? (
            <Button
              variant="secondary"
              className="animate-gradient rounded-xl bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground transition-all duration-300"
              onClick={() => navigate(INTERNAL_HREFS.DEV)}>
              <Code className="size-4 text-background" />
              <span className="sr-only">Dev Dashboard</span>
            </Button>
          ) : null}
          <InstallPWAButton />
        </div>
      </div>
      {devMode ? (
        <div className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-primary via-secondary to-primary py-0.5">
          <p className="text-center text-background text-xs">dev mode on</p>
        </div>
      ) : null}
    </header>
  );
}
