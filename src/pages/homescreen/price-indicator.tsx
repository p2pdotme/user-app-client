import AutoPlay from "embla-carousel-autoplay";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/contexts";
import { usePriceConfig } from "@/hooks";
import { cn, formatFiatAmount } from "@/lib/utils";

export function PriceIndicator() {
  const { t } = useTranslation();
  const {
    settings: { currency },
  } = useSettings();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const autoplay = useRef(
    AutoPlay({
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    }),
  );

  const {
    priceConfig,
    isPriceConfigLoading,
    isPriceConfigError,
    priceConfigError,
  } = usePriceConfig();

  useEffect(() => {
    if (!api) return;

    // Set initial values
    setCurrent(api.selectedScrollSnap());
    setCount(api.scrollSnapList().length);

    // Add event listener
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);

    // Cleanup function to remove event listener
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (isPriceConfigLoading)
    return <Skeleton className="my-5 h-10 w-52 rounded-full" />;
  if (isPriceConfigError)
    return (
      <p className="text-center text-destructive text-sm">
        {priceConfigError?.message}
      </p>
    );
  if (!priceConfig) return null;

  const priceData = [
    { type: "BUY_PRICE", price: priceConfig.buyPrice },
    { type: "SELL_PRICE", price: priceConfig.sellPrice },
  ];

  return (
    <div className="relative my-5 w-52">
      {/* SVG-based rotating border animation */}
      {/* path starts from the left center and draws the capsule */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 208 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <motion.path
            key={animKey}
            d="M0.5,20 A19.5,19.5 0 0,1 20,0.5 H188 A19.5,19.5 0 0,1 207.5,20 A19.5,19.5 0 0,1 188,39.5 H20 A19.5,19.5 0 0,1 0.5,20 Z"
            stroke="var(--primary)"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={488}
            initial={{ strokeDashoffset: 488 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              pathLength: 1,
              strokeLinejoin: "round",
            }}
          />
        </svg>
      </div>

      {/* Container with permanent border */}
      <motion.div
        id="price-indicator"
        className="relative z-10 flex h-10 items-center justify-between rounded-full border border-border bg-background px-2.5"
        onClick={() => {
          if (!api) return;
          const snaps = api.scrollSnapList();
          if (snaps.length <= 1) {
            setAnimKey((k) => k + 1);
            autoplay.current?.reset();
            return;
          }
          const nextIndex = (api.selectedScrollSnap() + 1) % snaps.length;
          api.scrollTo(nextIndex);
          setAnimKey((k) => k + 1);
          autoplay.current?.reset();
        }}>
        <Carousel
          plugins={[autoplay.current]}
          className="w-[95%]"
          orientation="vertical"
          setApi={setApi}>
          <CarouselContent className="h-12">
            {priceData.map((item, index) => (
              <CarouselItem key={index} className="h-12">
                <div className="flex h-full w-full items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <div className="size-2 shrink-0 animate-scale rounded-full bg-primary" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {t(item.type)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <p className="font-bold text-sm">
                      {formatFiatAmount(item.price, currency.currency)}
                    </p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="flex flex-col gap-0.5">
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "rounded-full transition-all duration-500",
                current === index
                  ? "h-4 w-1 bg-primary"
                  : "h-1 w-1 bg-primary/50",
              )}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
