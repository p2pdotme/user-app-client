import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface YouTubeVideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
  className?: string;
  isPortrait?: boolean; // New prop to indicate portrait mode videos
}

export function YouTubeVideoDialog({
  isOpen,
  onClose,
  videoUrl,
  title,
  className,
  isPortrait = false, // Default to landscape
}: YouTubeVideoDialogProps) {
  const { track } = useAnalytics();
  const [embedUrl, setEmbedUrl] = useState<string>("");

  const extractYouTubeVideoId = useCallback((url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }, []);

  useEffect(() => {
    if (videoUrl && isOpen) {
      const videoId = extractYouTubeVideoId(videoUrl);
      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&cc_load_policy=1`;
        setEmbedUrl(embedUrl);

        // Track video open event
        track(EVENTS.HELP, {
          status: "video_opened",
          videoId,
          videoUrl,
          title,
          isPortrait,
        });
      }
    }
  }, [videoUrl, isOpen, title, track, isPortrait, extractYouTubeVideoId]);

  const handleClose = () => {
    setEmbedUrl("");
    onClose();

    // Track video close event
    if (videoUrl) {
      const videoId = extractYouTubeVideoId(videoUrl);
      track(EVENTS.HELP, {
        status: "video_closed",
        videoId,
        videoUrl,
        title,
        isPortrait,
      });
    }
  };

  // Calculate dimensions based on orientation
  const getVideoDimensions = () => {
    if (isPortrait) {
      // For portrait videos, prioritize height and use a 9:16 aspect ratio
      return {
        width: "min(90vw, 400px)", // Smaller width for portrait
        height: "min(90vh, 700px)", // Larger height for portrait
        aspectRatio: "9/16",
        maxWidth: "400px",
        maxHeight: "90vh",
      };
    } else {
      // For landscape videos, use the original 16:9 aspect ratio
      return {
        width: "min(90vw, 800px)",
        height: "min(90vh, 450px)",
        aspectRatio: "16/9",
        maxWidth: "800px",
        maxHeight: "90vh",
      };
    }
  };

  const videoDimensions = getVideoDimensions();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "flex w-[98vw] max-w-3xl flex-col items-center justify-center p-4 sm:p-6",
          className,
        )}>
        {title && (
          <DialogHeader className="p-2 pb-1">
            <DialogTitle className="text-center font-semibold text-lg">
              {title}
            </DialogTitle>
          </DialogHeader>
        )}
        <div className="flex w-full flex-col items-center justify-center">
          {embedUrl ? (
            <div
              className="w-full"
              style={{
                aspectRatio: videoDimensions.aspectRatio,
                width: videoDimensions.width,
                height: videoDimensions.height,
                maxWidth: videoDimensions.maxWidth,
                maxHeight: videoDimensions.maxHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <iframe
                src={embedUrl}
                title={title || "YouTube video"}
                className="h-full w-full rounded-lg border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  width: "100%",
                  height: "100%",
                  border: 0,
                  borderRadius: "0.5rem",
                  background: "#000",
                }}
              />
            </div>
          ) : (
            <div
              className="flex w-full items-center justify-center bg-muted"
              style={{
                aspectRatio: videoDimensions.aspectRatio,
                width: videoDimensions.width,
                height: videoDimensions.height,
                maxWidth: videoDimensions.maxWidth,
                maxHeight: videoDimensions.maxHeight,
                minHeight: 200,
              }}>
              <p className="text-muted-foreground">Loading video...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easy usage
export function useYouTubeVideoDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isPortrait, setIsPortrait] = useState(false);

  const openVideo = (url: string, videoTitle?: string, portrait?: boolean) => {
    setVideoUrl(url);
    setTitle(videoTitle || "");
    setIsPortrait(portrait || false);
    setIsOpen(true);
  };

  const closeVideo = () => {
    setIsOpen(false);
    setVideoUrl("");
    setTitle("");
    setIsPortrait(false);
  };

  return {
    isOpen,
    videoUrl,
    title,
    isPortrait,
    openVideo,
    closeVideo,
  };
}
