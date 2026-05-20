import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldHelp } from "../FieldHelp";

describe("FieldHelp", () => {
  it("renders an accessible info button with the correct aria-label", () => {
    render(<FieldHelp label="Site slug">Use lowercase letters and hyphens.</FieldHelp>);
    const button = screen.getByRole("button", { name: "More information about Site slug" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("field-help__button");
  });

  it("renders the tooltip with role=tooltip and the provided text", () => {
    render(<FieldHelp label="Brand kit">Shared colors for all sites.</FieldHelp>);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Shared colors for all sites.");
  });

  it("associates the button with the tooltip via aria-describedby", () => {
    render(<FieldHelp label="Export">Creates local HTML files.</FieldHelp>);
    const button = screen.getByRole("button", { name: "More information about Export" });
    const tooltip = screen.getByRole("tooltip");
    expect(button).toHaveAttribute("aria-describedby", tooltip.id);
  });

  it("tooltip bubble has overflow-wrapping CSS class", () => {
    render(<FieldHelp label="Slug">Lowercase letters and hyphens only.</FieldHelp>);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveClass("field-help__bubble");
  });

  it("button shows text 'i' as the help indicator", () => {
    render(<FieldHelp label="Page title">Used in browser tab and export metadata.</FieldHelp>);
    const button = screen.getByRole("button", { name: "More information about Page title" });
    expect(button).toHaveTextContent("i");
  });
});
