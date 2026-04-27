import jupiterLogo from "@/assets/images/countdown/jupiterexchange-logo.svg";
import "./tge-countdown-banner.css";

const JUP_URL =
  "https://jup.ag/tokens/P2PXup1ZvMpCDkJn3PQxtBYgxeCSfH39SFeurGSmeta";

export const TgeCountdownBanner = () => (
  <a
    href={JUP_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="tge-cd-banner">
    <span className="tge-cd-live-dot" />
    <span className="tge-cd-text">
      <strong>$P2P</strong> is now LIVE on
    </span>
    <img src={jupiterLogo} alt="Jupiter" className="tge-cd-jup-logo" />
    <span className="tge-cd-jup-name">Jupiter</span>
    <span className="tge-cd-cta">Trade Now</span>
    <svg
      className="tge-cd-arrow"
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none">
      <path
        d="M3 11L11 3M11 3H4.5M11 3V9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </a>
);
