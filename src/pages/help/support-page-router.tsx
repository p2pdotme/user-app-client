import { Navigate, useParams } from "react-router";
import { INTERNAL_HREFS } from "@/lib/constants";
import { SUPPORT_PAGE_TITLES, type SupportPageTitle } from "./constants";
import { SupportPage } from "./support-page";

export function SupportPageWrapper() {
  const { title } = useParams();

  if (
    !title ||
    !Object.values(SUPPORT_PAGE_TITLES).includes(title as SupportPageTitle)
  ) {
    return (
      <Navigate
        to={`${INTERNAL_HREFS.HELP}/${SUPPORT_PAGE_TITLES.GETTING_STARTED}`}
        replace
      />
    );
  }

  return <SupportPage title={title} />;
}
