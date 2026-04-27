import { useTranslation } from "react-i18next";
import { Link } from "react-router";

interface SectionHeaderProps {
  title: string;
  seeAllLink?: string;
  seeAllText?: string;
}

export const SectionHeader = ({
  title,
  seeAllLink,
  seeAllText = "SEE_ALL",
}: SectionHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full items-center justify-between">
      <h3 className="font-medium text-lg">{title}</h3>
      {seeAllLink && (
        <Link to={seeAllLink} className="cursor-pointer text-primary text-sm">
          {t(seeAllText)}
        </Link>
      )}
    </div>
  );
};
