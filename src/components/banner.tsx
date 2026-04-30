import AutoPlay from "embla-carousel-autoplay";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IOSPWADrawer } from "@/components/ios-pwa-drawer";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { usePWA, useSettings } from "@/contexts";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { CURRENCY } from "@/lib/constants";
import { cn, isIOS } from "@/lib/utils";
import { CoinsMeBanner } from "@/pages/help/components/coinsme-banner";
import { JoinMerchantBanner } from "@/pages/help/components/join-merchant";
import { PerpsBanner } from "@/pages/help/components/perps-banner";
import { UnfreezeBanner } from "@/pages/help/components/unfreeze-banner";
import { VideoGuideBanner } from "@/pages/help/components/video-guide-banner";

export function Banner({
  openVideo,
}: {
  openVideo: (url: string, title: string) => void;
}) {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [isIOSDrawerOpen, setIsIOSDrawerOpen] = useState(false);
  const { isInstallPromptVisible, handleInstallClick } = usePWA();
  const {
    settings: { currency },
  } = useSettings();
  const isINR = currency.currency === CURRENCY.INR;

  // Check if app is already installed (running in standalone mode)
  const isInstalled = window.matchMedia("(display-mode: standalone)").matches;

  // Use same visibility logic as InstallPWAButton
  const shouldShowPWABanner =
    !isInstalled && (isIOS() || isInstallPromptVisible);

  const AUTOPLAY_DELAY = 5000;
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const startProgress = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setProgress(0);
    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const pct = Math.min((elapsed / AUTOPLAY_DELAY) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrentIndex(api.selectedScrollSnap());
    startProgress();

    api.on("select", () => {
      setCurrentIndex(api.selectedScrollSnap());
      startProgress();
    });

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [api, startProgress]);

  const handlePWAInstallClick = () => {
    track(EVENTS.PWA, {
      status: "banner_clicked",
      location: "homescreen",
      bannerName: "pwa_install",
      deviceType: isIOS() ? "ios" : "android",
      isInstalled,
    });

    if (isIOS()) {
      // Show iOS installation instructions drawer (same as InstallPWAButton)
      setIsIOSDrawerOpen(true);
    } else {
      // Use native install prompt for other browsers
      handleInstallClick();
    }
  };

  return (
    <>
      <Carousel
        plugins={[AutoPlay({ delay: 5000 })]}
        setApi={setApi}
        className="w-full"
        opts={{ loop: true }}>
        <CarouselContent>
          {/* Perps / Leverage Trading Banner */}
          <CarouselItem>
            <PerpsBanner />
          </CarouselItem>

          {/* Unfreeze.pro Banner — INR users only */}
          {isINR && (
            <CarouselItem>
              <UnfreezeBanner />
            </CarouselItem>
          )}

          {/* Join Merchant Banner */}
          <CarouselItem>
            <JoinMerchantBanner />
          </CarouselItem>

          {/* CoinsMe Banner */}
          <CarouselItem>
            <CoinsMeBanner />
          </CarouselItem>

          {/* PWA Install Banner - Use same logic as InstallPWAButton */}
          {shouldShowPWABanner && (
            <CarouselItem>
              <BannerItem bgColor="bg-gradient-to-r from-primary to-black">
                <div
                  className="flex h-full w-full cursor-pointer items-center justify-between gap-4 px-5 py-6"
                  onClick={handlePWAInstallClick}
                  role="button"
                  tabIndex={0}>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-lg text-white">
                      {t("PWA_INSTALL_BANNER_TITLE")}
                    </h3>
                    <p className="text-sm text-white/80">
                      {t("PWA_INSTALL_BANNER_DESCRIPTION")}
                    </p>
                  </div>
                  <div className="flex items-center justify-center rounded-lg border-2 border-white p-2 text-center font-semibold text-base text-white hover:bg-white/10 hover:text-white">
                    {t("INSTALL_NOW")}
                  </div>
                </div>
              </BannerItem>
            </CarouselItem>
          )}

          {/* Video Guide Banner */}
          <CarouselItem>
            <VideoGuideBanner onVideoOpen={openVideo} />
          </CarouselItem>
        </CarouselContent>
      </Carousel>
      <div className="mt-3 flex items-center justify-center gap-2 px-4">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="h-1.5 w-5 overflow-hidden rounded-full bg-primary/20">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width:
                  currentIndex === index
                    ? `${progress}%`
                    : index < currentIndex
                      ? "100%"
                      : "0%",
                transition:
                  currentIndex === index ? "none" : "width 300ms ease",
              }}
            />
          </div>
        ))}
      </div>

      {/* iOS PWA Installation Drawer */}
      {isIOS() && (
        <IOSPWADrawer
          isOpen={isIOSDrawerOpen}
          onClose={() => setIsIOSDrawerOpen(false)}
        />
      )}
    </>
  );
}

interface BannerItemProps {
  bgImage?: string;
  bgColor?: string;
  children: React.ReactNode;
}

export function BannerItem({ bgImage, bgColor, children }: BannerItemProps) {
  return (
    <div
      className={`relative flex h-28 w-full flex-col items-center justify-center overflow-hidden rounded-xl shadow-md ${bgColor}`}>
      {bgImage && (
        <img
          src={bgImage}
          alt="banner background"
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            bgColor,
            bgColor ? "mix-blend-overlay" : "",
          )}
        />
      )}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
