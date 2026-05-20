import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SectionVariantField } from "../SectionVariantField";
import { createDefaultSection } from "../../sectionDefaults";

describe("SectionVariantField", () => {
  it("renders a Visual style select with the hint text", () => {
    render(<SectionVariantField value={undefined} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Visual style")).toBeInTheDocument();
    expect(screen.getByText(/visual treatment/)).toBeInTheDocument();
  });

  it("shows Default (empty string value) when variant is undefined", () => {
    render(<SectionVariantField value={undefined} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Visual style")).toHaveValue("");
  });

  it("reflects the current variant in the select", () => {
    render(<SectionVariantField value="soft-card" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Visual style")).toHaveValue("soft-card");
  });

  it("calls onChange with the selected variant string", () => {
    const onChange = vi.fn();
    render(<SectionVariantField value={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Visual style"), { target: { value: "soft-card" } });
    expect(onChange).toHaveBeenCalledWith("soft-card");
  });

  it("calls onChange with undefined when Default is selected", () => {
    const onChange = vi.fn();
    render(<SectionVariantField value="soft-card" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Visual style"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("shows a description for non-default variants", () => {
    render(<SectionVariantField value="soft-card" onChange={vi.fn()} />);
    expect(screen.getByText("Adds lifted card styling.")).toBeInTheDocument();
  });

  it("shows no variant description when Default is selected", () => {
    render(<SectionVariantField value={undefined} onChange={vi.fn()} />);
    expect(screen.queryByText(/lifted|darker|Centers|larger|stripped/i)).not.toBeInTheDocument();
  });

  it("lists all 6 variant options", () => {
    render(<SectionVariantField value={undefined} onChange={vi.fn()} />);
    const select = screen.getByLabelText("Visual style") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((o) => o.value);
    expect(optionValues).toEqual(["", "soft-card", "contrast-band", "centered", "editorial", "minimal"]);
  });
});

describe("Section variant defaults", () => {
  it("Problem sections default to soft-card variant", () => {
    const section = createDefaultSection("problem");
    expect(section.variant).toBe("soft-card");
  });

  it("Services sections default to soft-card variant", () => {
    const section = createDefaultSection("services");
    expect(section.variant).toBe("soft-card");
  });

  it("Hero sections have no explicit variant by default", () => {
    const section = createDefaultSection("hero");
    expect(section.variant).toBeUndefined();
  });
});
