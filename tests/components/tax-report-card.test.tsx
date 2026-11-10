import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaxReportCard } from "@/pages/help/components/tax-report-card";

describe("TaxReportCard", () => {
  it("says filing is the user's responsibility and opens the report", async () => {
    const onClick = vi.fn();
    render(<TaxReportCard onClick={onClick} />);
    const card = screen.getByRole("button", { name: /Tax report/ });
    expect(card).toHaveTextContent(
      "Filing your taxes is your own responsibility.",
    );
    expect(card).toHaveTextContent(
      "helps you calculate your crypto tax on P2P.me orders and sort out your filings",
    );
    await userEvent.setup().click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
