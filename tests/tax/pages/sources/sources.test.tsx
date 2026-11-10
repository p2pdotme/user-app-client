import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@tests/tax/helpers/render";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { SOURCES } from "@/tax/core/tax/sources";
import { Report } from "@/tax/pages/report";
import { Sources } from "@/tax/pages/sources";

function renderAt(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/tax" element={<Report />} />
      <Route path="/tax/sources" element={<Sources />} />
    </Routes>,
    { route },
  );
}

describe("/tax/sources page", () => {
  it("groups sources, opens each in a new tab and badges official vs third-party", async () => {
    renderAt("/tax/sources");
    expect(screen.getByText("Legal sources")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", {
        name: "Official (Government of India)",
      }),
    ).toBeInTheDocument();
    for (const title of [
      "CBDT Circulars & Notifications",
      "Income-tax Act, 2025 (from 1 April 2026)",
      "File & Check",
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    for (const s of SOURCES) {
      const link = screen.getByRole("link", {
        name: new RegExp(s.title.replace(/[()]/g, ".")),
      });
      expect(link).toHaveAttribute("href", s.url);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(screen.getAllByText("Official")).toHaveLength(
      SOURCES.filter((s) => s.isOfficial).length,
    );
    expect(screen.getAllByText("Third-party copy")).toHaveLength(
      SOURCES.filter((s) => !s.isOfficial).length,
    );
    expect(screen.getByText(/Last reviewed: 07\/11\/2026/)).toBeInTheDocument();
  });

  it("is linked from the report and goes back to it", async () => {
    const user = userEvent.setup();
    renderAt("/tax");
    await user.click(
      within(screen.getByRole("contentinfo")).getByRole("link", {
        name: /Legal sources/,
      }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Official (Government of India)",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Go back" }));
    expect(
      await screen.findByRole("button", { name: "Generate report" }),
    ).toBeInTheDocument();
  });
});
