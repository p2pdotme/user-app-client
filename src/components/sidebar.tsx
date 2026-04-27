import {
  ArrowLeftCircle,
  ArrowRight,
  Key,
  LogOut,
  Mail,
  Phone,
  Radio,
  Settings,
  User,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { useProfiles } from "thirdweb/react";
import ASSETS from "@/assets";
import { ConnectionStatusDrawer } from "@/components/connection-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDomainReachability } from "@/contexts/domain-reachability";
import { thirdwebClient } from "@/core/adapters/thirdweb";
import { useThirdweb } from "@/hooks";
import { INTERNAL_HREFS, URLS } from "@/lib/constants";
import { SocialLinks } from "./social-links";
import { TextLogo } from "./text-logo";
import { VersionBadge } from "./version-badge";

const SidebarItems = () => {
  const { t } = useTranslation();
  return [
    {
      label: t("MY_LIMITS"),
      icon: <ASSETS.ICONS.SidebarLimits className="size-5 text-primary" />,
      to: INTERNAL_HREFS.LIMITS,
    },
    {
      label: t("TRANSACTIONS"),
      icon: (
        <ASSETS.ICONS.SidebarTransactions className="size-5 text-primary" />
      ),
      to: INTERNAL_HREFS.TRANSACTIONS,
    },
    {
      label: t("REFER_AND_EARN"),
      icon: <ASSETS.ICONS.SidebarReferral className="size-5 text-primary" />,
      to: INTERNAL_HREFS.REFERRAL,
    },
    {
      label: t("HELP_AND_SUPPORT"),
      icon: <ASSETS.ICONS.ActionSupport className="size-5 text-primary" />,
      to: INTERNAL_HREFS.HELP,
    },
    {
      label: t("SETTINGS"),
      icon: <Settings className="size-5 text-primary" />,
      to: INTERNAL_HREFS.SETTINGS,
    },
  ].map((item) => (
    <Link
      to={item.to}
      key={item.label}
      className="flex cursor-pointer items-center justify-between">
      <div className="flex items-center gap-4">
        {item.icon}
        <p className="font-medium">{item.label}</p>
      </div>
      <ArrowRight className="size-6" />
    </Link>
  ));
};

export function Sidebar({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { disconnect } = useThirdweb();
  const navigate = useNavigate();
  const { data: profiles } = useProfiles({
    client: thirdwebClient,
  });

  const loggedIn = useMemo(() => {
    switch (profiles?.[0]?.type) {
      case "google": {
        // @ts-expect-error - thirdweb typing is not correct 🫩
        // log it out to see the actual type
        //   {
        //     "type": "google",
        //     "details": {
        //         "email": "unknown@unknown.com",
        //         "hd": "unknown.com",
        //         "id": "1234567890",
        //         "name": "unknown",
        //         "picture": "https://lh3.googleusercontent.com/a-/ALV-UjX8voj85ycXW09Z1cg1PMXRNAaeQBdwpxH-Yc2xJX1nhDuNZNWMLAhbWJxtFD0TZPxuK0GdyJKB5JgzbJza-jEWwK1rlULAYXpP6FdDbSXoeB81zqoUklRppfSmDKGC6IQaREbsI51_HDwLQNbHSkdqLwHiyKPVUQrvWl8SAA7dQk3UWcSKHibnia8Ghy4LNKFAF9viSVe8N8RHdGOiEb5e_CG2D-Q8gakC5XP6AQUiP49R7QIeGNg39Hp03NwEBSdShmNPs6KunaAv5Xup7LCS1bmjq_TFBnrx57nZ4CoQcTMp_AegO2cE47ycbhLpoVPnwrJ7EJ11C-2sRq3ww4fZKUXkOX-4TlzON2BPSrQndKOba2i3YJWgg1LgeYcFQai5nrdSF9k4TlDRkNTyhS9REKLFPGEOSb3s_nnLmVtk41RDWuQSMG1yVnEsv0l1L9SrFSFsyO3tU_hnQaZMScSAXJ21dBXgC0fpepWgnw5d4Amg7Ob99Gh5yFp59apnHKm5AXHWZpv98TuJ9VdMJVPH5XfiHaxeQ6IGUqTngW--liTMVShbAkbmsbR-gx1uyCO7wwp2hQhYzgi91oIazgopwMbxdwxQDnYV-wxcVSAidI16xTQploGbHb2DPhNu7O9rDomc3WxalRedR-vS3cslfqPqiyu2q4ouFw0CCpMxvmZdFMeZFFGvr3zkTDy7xC5lP14zFlJxAKax12ZeAhg8iv4N6xZ_x6FZFQtaJKxtnGVXYcHt1IxlulGeXx40roaFv1L6NefE-qw3ZKu3T51Xwqbq00tB3KS7I8u9BXqnBotVgUsoDPgKrlpqvT55BV6S2CD_M_gsbDrOKv-sysl6mUQ8fwAdyhAq6be8HfO-T8zLwPcjFtKJSe-n-kAt8kTm_nqn_-JWt9SnAfjJoTpjSqS6ZDo3iuDEKUpmLCaMndnikwBaeq6YdGWK5aYTQco3XESJjmjFo4wnNazsueIiLltyIQ=s96-c",
        //         "givenName": "unknown
        //         "emailVerified": true
        //     }
        // }
        const pictureSrc = profiles?.[0]?.details.picture ?? "";
        return {
          via: profiles?.[0]?.details.email,
          picture: (
            <img
              src={pictureSrc}
              alt="profile"
              className="size-8 rounded-full"
            />
          ),
        };
      }
      case "passkey":
        return {
          via: profiles?.[0]?.type,
          picture: (
            <div className="flex w-fit items-center gap-2 rounded-full bg-primary p-2">
              <Key className="size-5 text-primary-foreground" />
            </div>
          ),
        };
      case "email":
        return {
          via: profiles?.[0]?.details.email,
          picture: (
            <div className="flex w-fit items-center gap-2 rounded-full bg-primary p-2">
              <Mail className="size-5 text-primary-foreground" />
            </div>
          ),
        };
      case "phone":
        return {
          via: profiles?.[0]?.details.phone,
          picture: (
            <div className="flex w-fit items-center gap-2 rounded-full bg-primary p-2">
              <Phone className="size-5 text-primary-foreground" />
            </div>
          ),
        };
      case "guest":
        return {
          via: t("GUEST"),
          picture: (
            <div className="flex w-fit items-center gap-2 rounded-full bg-primary p-2">
              <User className="size-5 text-primary-foreground" />
            </div>
          ),
        };
      default:
        return {
          via: "UNKNOWN",
          picture: (
            <div className="flex w-fit items-center gap-2 rounded-full bg-primary p-2">
              <User className="size-5 text-primary-foreground" />
            </div>
          ),
        };
    }
  }, [profiles, t]);
  const { isReachable } = useDomainReachability();

  // const handlePromoCardClick = () => {
  //   window.open(URLS.LP_APP, "_blank");
  //   // DRAWER SHOWING ALL THREE LP APP LINKS TILL THEY ARE UNIFIED
  // };

  return (
    <Sheet>
      <SheetTrigger className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border">
        {children}
      </SheetTrigger>
      <SheetContent side="left" className="flex h-full flex-col p-0">
        {/* Fixed Header */}
        <SheetHeader className="flex-shrink-0 border-b p-4">
          <SheetTitle className="flex w-full items-center justify-between gap-2">
            <TextLogo />
            <SheetClose>
              <ArrowLeftCircle className="size-6 cursor-pointer text-primary" />
            </SheetClose>
          </SheetTitle>
          <SheetDescription className="my-2 hidden">P2P.me</SheetDescription>
        </SheetHeader>

        {/* Scrollable Content */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-6 px-4">
            <SidebarItems />
            <ConnectionStatusDrawer>
              <div className="flex w-full cursor-pointer items-center justify-between">
                <div className="flex items-center gap-4">
                  <Radio className="size-5 text-primary" />
                  <p className="font-medium">{t("CONNECTION_STATUS")}</p>
                </div>
                {isReachable && (
                  <div className="rounded-full bg-success/20 p-1">
                    <div className="size-2 animate-scale rounded-full bg-success" />
                  </div>
                )}
                {!isReachable && (
                  <div className="rounded-full bg-destructive/20 p-1">
                    <div className="size-2 animate-scale rounded-full bg-destructive" />
                  </div>
                )}
              </div>
            </ConnectionStatusDrawer>
          </div>
        </ScrollArea>

        {/* Fixed Footer */}
        <SheetFooter className="flex-shrink-0 border-t p-4">
          <div className="flex w-full flex-col gap-4">
            {/* Promotional Card */}
            {/* <Card
              onClick={handlePromoCardClick}
              className="bg-primary/10 w-full border-none py-4 shadow-none">
              <CardHeader>
                <CardTitle>
                  {t("POWER_THE_NETWORK_COMMA_EARN_PASSIVELY")}
                </CardTitle>
                <CardDescription>
                  {t("POWER_THE_NETWORK_COMMA_EARN_PASSIVELY_DESCRIPTION")}
                </CardDescription>
              </CardHeader>
            </Card> */}
            {/* User Info Card */}
            <Card className="w-full border-none bg-primary/10 py-4 shadow-none">
              <CardContent className="flex items-center gap-2">
                {loggedIn.picture}
                <div className="flex flex-col">
                  <p className="font-medium text-sm">{t("LOGGED_IN_VIA")}</p>
                  <p className="text-muted-foreground text-xs">
                    {loggedIn.via}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Social Links and Logout */}
            <div className="flex w-full flex-col gap-2">
              <p className="font-medium text-sm">{t("FIND_US_ON")}</p>
              <div className="flex items-center justify-between gap-2">
                <SocialLinks />
                <Button
                  onClick={() => {
                    disconnect();
                    navigate(INTERNAL_HREFS.LOGIN);
                  }}
                  variant="outline"
                  size="icon"
                  className="border-none bg-primary/20">
                  <LogOut className="size-5 text-primary" />
                </Button>
              </div>
            </div>

            {/* Version and Terms */}
            <div className="flex items-center justify-center gap-2">
              <VersionBadge />
              <Separator orientation="vertical" className="h-4" />
              <Link
                to={URLS.TERMS_AND_CONDITIONS}
                target="_blank"
                className="cursor-pointer font-light text-xs">
                {t("TERMS_AND_CONDITIONS")}
              </Link>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
