import { useSettings } from "@/contexts";

export function useSupportChat() {
  const {
    settings: { currency },
  } = useSettings();

  const openSupportChat = () => {
    window.open(
      currency.telegramSupportChannel,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return { openSupportChat };
}
