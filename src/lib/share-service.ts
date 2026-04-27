import { toast } from "sonner";
import { i18n } from "@/lib/i18n";

export interface ShareData {
  title: string;
  text: string;
  blob: Blob;
  filename: string;
}

export interface ShareServiceOptions {
  enableFallback?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * Share service that handles Web Share API and fallback download
 */
export class ShareService {
  private options: Required<ShareServiceOptions>;

  constructor(options: ShareServiceOptions = {}) {
    this.options = {
      enableFallback: true,
      showSuccessToast: true,
      showErrorToast: true,
      ...options,
    };
  }

  /**
   * Share content using Web Share API or fallback to download
   */
  async share(data: ShareData): Promise<void> {
    try {
      if (this.canUseWebShare(data)) {
        await this.shareUsingWebAPI(data);
      } else if (this.options.enableFallback) {
        await this.shareUsingFallback(data);
      } else {
        throw new Error(i18n.t("WEB_SHARE_UNAVAILABLE_FALLBACK_DISABLED"));
      }
    } catch (error) {
      if (this.options.showErrorToast) {
        toast.error(i18n.t("FAILED_TO_SHARE_RECEIPT"), {
          description:
            error instanceof Error ? error.message : i18n.t("UNKNOWN_ERROR"),
        });
      }
      throw error;
    }
  }

  /**
   * Check if Web Share API is available and supports files
   */
  private canUseWebShare(data: ShareData): boolean {
    if (!navigator.share || !navigator.canShare) {
      return false;
    }

    const file = new File([data.blob], data.filename, { type: data.blob.type });
    return navigator.canShare({
      files: [file],
      title: data.title,
      text: data.text,
      url: window.location.href, // Required on Windows for Web Share API for some reason
    });
  }

  /**
   * Share using Web Share API
   */
  private async shareUsingWebAPI(data: ShareData): Promise<void> {
    const file = new File([data.blob], data.filename, { type: data.blob.type });

    await navigator.share({
      title: data.title,
      text: data.text,
      files: [file],
      url: window.location.href, // Required on Windows for Web Share API for some reason
    });
  }

  /**
   * Fallback to download when Web Share API is not available
   */
  private async shareUsingFallback(data: ShareData): Promise<void> {
    const url = URL.createObjectURL(data.blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = data.filename;
    a.style.display = "none";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    if (this.options.showSuccessToast) {
      toast.success(i18n.t("RECEIPT_DOWNLOADED_SUCCESSFULLY"));
    }
  }

  /**
   * Check if device supports Web Share API
   */
  static isWebShareSupported(): boolean {
    return typeof navigator !== "undefined" && "share" in navigator;
  }

  /**
   * Check if device supports file sharing via Web Share API
   */
  static isFileShareSupported(): boolean {
    return (
      ShareService.isWebShareSupported() &&
      "canShare" in navigator &&
      typeof navigator.canShare === "function"
    );
  }
}

/**
 * Default share service instance
 */
export const shareService = new ShareService();

/**
 * Utility function for quick sharing
 */
export async function shareReceipt(
  blob: Blob,
  filename: string,
  title: string,
  text: string,
): Promise<void> {
  return shareService.share({
    title,
    text,
    blob,
    filename,
  });
}
