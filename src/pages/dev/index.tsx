import {
  Bell,
  Camera,
  ChevronRight,
  Film,
  Vibrate,
  Volume2,
} from "lucide-react";
import { Link } from "react-router";
import { NonHomeHeader } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/contexts";
import { INTERNAL_HREFS } from "@/lib/constants";

const DEV_DEMOS = [
  {
    name: "Camera & QR Scanner",
    description: "Test camera permissions and QR code scanning with parsing",
    href: INTERNAL_HREFS.DEV_CAMERA,
    icon: Camera,
    ready: true,
  },
  {
    name: "Toasts Demo",
    description: "Test toast variants and behaviors",
    href: INTERNAL_HREFS.DEV_TOASTS,
    icon: Bell,
    ready: true,
  },
  {
    name: "Lottie Animations",
    description:
      "Preview and test all Lottie animations with configurable props",
    href: INTERNAL_HREFS.DEV_ANIMATIONS,
    icon: Film,
    ready: true,
  },
  {
    name: "Haptics Demo",
    description: "Test haptic feedback patterns and integration examples",
    href: INTERNAL_HREFS.DEV_HAPTICS,
    icon: Vibrate,
    ready: true,
  },
  {
    name: "Sounds Demo",
    description: "Test sound feedback patterns and integration examples",
    href: INTERNAL_HREFS.DEV_SOUNDS,
    icon: Volume2,
    ready: true,
  },
  // Future demos can be added here easily
  // {
  //   name: "UI Components",
  //   description: "Preview Shadcn UI components",
  //   href: "/dev/components",
  //   icon: Palette,
  //   ready: false,
  // },
];

export function DevDashboard() {
  const { settings } = useSettings();

  if (!settings.devMode) {
    console.error("Dev pages are only available in development environment");
    return null;
  }

  return (
    <>
      <NonHomeHeader title="Developer Dashboard" showHelp={false} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-6 overflow-y-auto py-8">
        {/* Demo Links */}
        <div className="flex flex-col gap-3">
          {DEV_DEMOS.map((demo) => {
            const Icon = demo.icon;

            if (!demo.ready) {
              return (
                <Card key={demo.name} className="opacity-60">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <h3 className="font-medium">{demo.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {demo.description}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Link key={demo.name} to={demo.href}>
                <Card className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
                  <CardContent className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <h3 className="font-medium">{demo.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {demo.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
