import { AlertTriangle, Camera, Upload, Zap, ZapOff } from "lucide-react";
import QrScannerLib from "qr-scanner";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSounds } from "@/hooks";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface QrScannerProps {
  onScan: (data: string) => void;
  className?: string;
  isProcessing?: boolean;
  processingMessage?: string;
}

export function QrScanner({
  onScan,
  className,
  isProcessing = false,
  processingMessage = "Processing...",
}: QrScannerProps) {
  const { t } = useTranslation();
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlashSupport, setHasFlashSupport] = useState(false);
  const [canScan, setCanScan] = useState(true);
  const [lastScannedData, setLastScannedData] = useState<string | null>(null);
  const { triggerQrScanSound } = useSounds();

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerLib | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);

  // Use a ref to store the latest callback to avoid stale closures
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const handleScanResult = useCallback(
    (data: string) => {
      // Layer 1: Throttling Protection - Check if we can scan
      if (!canScan || isProcessing) {
        return;
      }

      // Layer 2: Duplicate Detection - Ignore same QR code content
      if (lastScannedData === data) {
        return;
      }

      // ✅ Just update state and trigger feedback
      setCanScan(false);
      setLastScannedData(data);
      triggerQrScanSound();

      // Call the parent's onScan handler using the ref to avoid stale closures
      onScanRef.current(data);

      // Layer 3: Silent cooldown period (2 seconds)
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }

      cooldownTimerRef.current = setTimeout(() => {
        setCanScan(true);
        setLastScannedData(null); // Reset duplicate detection
      }, 2000);
    },
    [canScan, isProcessing, lastScannedData, triggerQrScanSound],
  );

  // Handle file upload with same protection
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const result = await QrScannerLib.scanImage(file, {
          returnDetailedScanResult: true,
        });
        handleScanResult(result.data);
      } catch (error) {
        console.error("Error scanning uploaded file:", error);
      }

      event.target.value = "";
    },
    [handleScanResult],
  );

  // Flash toggle functionality
  const toggleFlash = useCallback(async () => {
    if (scannerRef.current && hasFlashSupport && !isProcessing) {
      try {
        await scannerRef.current.toggleFlash();
        setIsFlashOn(scannerRef.current.isFlashOn());
      } catch (error) {
        console.error("Error toggling flash:", error);
      }
    }
  }, [hasFlashSupport, isProcessing]);

  // Cleanup scanner resources
  const cleanupScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      } catch (error) {
        console.warn("Error cleaning up scanner:", error);
      }
      scannerRef.current = null;
    }
  }, []);

  // Initialize scanner function - can be called to start or restart
  const initScanner = useCallback(async () => {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializingRef.current) return;

    // If scanner already exists and is working, don't reinitialize
    if (scannerRef.current && hasCamera && !cameraError) return;

    isInitializingRef.current = true;

    try {
      const videoEl = videoRef.current;
      if (!videoEl) {
        isInitializingRef.current = false;
        return;
      }

      // Clean up existing scanner before reinitializing
      cleanupScanner();

      // Reset error state
      setCameraError("");
      setHasCamera(false);

      const scanner = new QrScannerLib(
        videoEl,
        (result: QrScannerLib.ScanResult) => {
          handleScanResult(result.data);
        },
        {
          returnDetailedScanResult: true,
          maxScansPerSecond: 2,
          preferredCamera: "environment",
          highlightCodeOutline: true,
          calculateScanRegion: (video) => {
            const smallerDimension = Math.min(
              video.videoWidth,
              video.videoHeight,
            );
            return {
              x: Math.round((video.videoWidth - smallerDimension) / 2),
              y: Math.round((video.videoHeight - smallerDimension) / 2),
              width: smallerDimension,
              height: smallerDimension,
            };
          },
        },
      );

      scannerRef.current = scanner;
      scanner.setInversionMode("both");

      await scanner.start();
      setHasCamera(true);
      setCameraError("");

      // Monitor the video track for interruptions (e.g., push notifications)
      const stream = videoEl.srcObject as MediaStream | null;
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          // Handle track ending (camera interrupted)
          videoTrack.onended = () => {
            console.warn("Camera track ended unexpectedly");
            setCameraError(t("CAMERA_ACCESS_FAILED"));
            setHasCamera(false);
          };

          // Handle track being muted (some devices do this on interruption)
          videoTrack.onmute = () => {
            console.warn("Camera track muted");
          };

          videoTrack.onunmute = () => {
            console.log("Camera track unmuted");
          };
        }
      }

      // Check for flash support
      try {
        const hasFlash = await scanner.hasFlash();
        setHasFlashSupport(hasFlash);
        if (hasFlash) {
          setIsFlashOn(scanner.isFlashOn());
        }
      } catch (error) {
        console.warn("Could not check flash support:", error);
        setHasFlashSupport(false);
      }
    } catch (error) {
      console.error("Camera failed:", error);
      setCameraError(t("CAMERA_ACCESS_FAILED"));
      setHasCamera(false);
    } finally {
      isInitializingRef.current = false;
    }
  }, [handleScanResult, cleanupScanner, t, cameraError, hasCamera]);

  // Initialize scanner on mount
  // biome-ignore lint: Only run once on mount, dependencies are intentionally omitted
  useEffect(() => {
    if (!videoRef.current) return;

    initScanner();

    return () => {
      // Cleanup timer
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }

      // Cleanup scanner only on unmount
      cleanupScanner();
    };
  }, []); // Only run once on mount

  // Handle visibility change - reinitialize camera when page becomes visible again
  // This handles cases where push notifications or app switching interrupts the camera
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Check if camera was working and now has an error, or if video track ended
        const videoEl = videoRef.current;
        const stream = videoEl?.srcObject as MediaStream | null;
        const videoTrack = stream?.getVideoTracks()[0];

        // Reinitialize if:
        // 1. There's a camera error
        // 2. No video track exists
        // 3. Video track has ended
        const needsReinit =
          cameraError || !videoTrack || videoTrack.readyState === "ended";

        if (needsReinit && !isInitializingRef.current) {
          console.log("Reinitializing camera after visibility change");
          initScanner();
        }
      }
    };

    // Also handle page focus for iOS Safari which may not fire visibilitychange
    const handleFocus = () => {
      // Clear any existing focus timer
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }

      // Delay slightly to let the page fully regain focus
      focusTimerRef.current = setTimeout(() => {
        const videoEl = videoRef.current;
        const stream = videoEl?.srcObject as MediaStream | null;
        const videoTrack = stream?.getVideoTracks()[0];

        if (
          (cameraError || !videoTrack || videoTrack.readyState === "ended") &&
          !isInitializingRef.current
        ) {
          console.log("Reinitializing camera after focus");
          initScanner();
        }
      }, 500);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      // Clear focus timer on cleanup
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [cameraError, initScanner]);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl border-2 border-primary shadow-[0_0_20px_var(--primary-shadow)]">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
        />

        {/* Flash button */}
        {hasFlashSupport && hasCamera && !isProcessing && (
          <Button
            onClick={toggleFlash}
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 p-0 backdrop-blur-sm hover:bg-background/90">
            {isFlashOn ? (
              <Zap className="h-4 w-4 text-warning" />
            ) : (
              <ZapOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )}

        {/* Show error or loading state */}
        {(cameraError || !hasCamera) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-background/90 backdrop-blur-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
              {cameraError ? (
                <AlertTriangle className="h-8 w-8" />
              ) : (
                <Camera className="h-8 w-8" />
              )}
            </div>
            <div className="space-y-2 text-center">
              <p className="font-medium text-foreground">
                {cameraError || "Starting camera..."}
              </p>
            </div>
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="font-medium text-foreground text-sm">
                {processingMessage}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload option */}
      <Label
        htmlFor="qr-file-upload"
        className="flex cursor-pointer items-center gap-2 rounded-md border border-primary px-6 py-3 transition-all duration-200 hover:bg-primary/5">
        <Upload className="size-4 text-primary" />
        <span className="font-medium text-primary text-sm">
          {t("UPLOAD_QR")}
        </span>
        <Input
          id="qr-file-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </Label>
    </div>
  );
}
