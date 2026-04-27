import { useOrders } from "@p2pdotme/sdk/react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Order } from "@/core/adapters/thirdweb/validation";
import {
  generateReceiptImage,
  generateShareText,
  type ReceiptGeneratorOptions,
  transformOrderToReceipt,
} from "@/lib/receipt-generator";
import { ShareService, shareService } from "@/lib/share-service";
import { getPaymentAddressFromOrderDetails } from "@/lib/utils";

export interface UseReceiptShareProps {
  order: Order;
  options?: ReceiptGeneratorOptions;
}

export interface UseReceiptShareReturn {
  shareReceipt: () => Promise<void>;
  isSharing: boolean;
  isSupported: boolean;
}

/**
 * Clean hook for sharing receipts without DOM manipulation
 */
export function useReceiptShare({
  order,
  options = {},
}: UseReceiptShareProps): UseReceiptShareReturn {
  const [isSharing, setIsSharing] = useState(false);
  const { t } = useTranslation();
  const orders = useOrders();

  const shareReceipt = useCallback(async () => {
    if (isSharing) return;

    setIsSharing(true);
    try {
      // Get payment details for all order types
      let paymentFrom: string | undefined;
      let paymentTo: string | undefined;

      if (order.orderType === "SELL" || order.orderType === "PAY") {
        // Get encrypted merchant payment address and decrypt it
        if (order.encMerchantUpi) {
          const decrypted = await orders.decryptPaymentAddress({
            encrypted: order.encMerchantUpi,
          });
          if (decrypted.isErr()) {
            console.error(
              "Failed to decrypt merchant payment address:",
              decrypted.error,
            );
          } else {
            paymentFrom = decrypted.value;
          }
        }

        // Get local payment address
        paymentTo = getPaymentAddressFromOrderDetails(order.id.toString());
      } else if (order.orderType === "BUY") {
        // For BUY orders, decrypt merchant's payment address from encUpi
        if (order.encUpi) {
          const decrypted = await orders.decryptPaymentAddress({
            encrypted: order.encUpi,
          });
          if (decrypted.isErr()) {
            console.error(
              "Failed to decrypt merchant payment address:",
              decrypted.error,
            );
          } else {
            paymentTo = decrypted.value; // User pays TO the merchant
          }
        }
      }

      // Transform order to receipt data
      const receiptData = await transformOrderToReceipt(
        order,
        paymentFrom,
        paymentTo,
      );

      // Generate receipt image
      const receiptBlob = await generateReceiptImage(receiptData, t, {
        devicePixelRatio: window.devicePixelRatio || 2,
        ...options,
      });

      // Generate share text
      const shareText = generateShareText(receiptData, t);

      // Share the receipt
      await shareService.share({
        title: t("P2P_ME_TRANSACTION_RECEIPT"),
        text: shareText,
        blob: receiptBlob,
        filename: `p2p-receipt-${order.id}.png`,
      });
    } catch (error) {
      console.error("Error sharing receipt:", error);

      // Only show error toast if it's not a user cancellation
      if (error instanceof Error && error.name !== "AbortError") {
        toast.error(t("FAILED_TO_SHARE_RECEIPT"), {
          description: error.message,
        });
      }
    } finally {
      setIsSharing(false);
    }
  }, [order, options, isSharing, t, orders.decryptPaymentAddress]);

  const isSupported =
    ShareService.isWebShareSupported() || ShareService.isFileShareSupported();

  return {
    shareReceipt,
    isSharing,
    isSupported,
  };
}
