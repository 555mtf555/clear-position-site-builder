import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SectionStyleControls } from "../SectionStyleControls";

const baseProps = {
  background_color: undefined,
  text_color: undefined,
  font_size_scale: undefined,
  font_family_preset: undefined,
};

describe("SectionStyleControls typography", () => {
  it("renders a Text size select defaulting to Default", () => {
    render(
      <SectionStyleControls
        variant={undefined}
        props={baseProps}
        onChange={vi.fn()}
      />,
    );
    const select = screen.getByLabelText("Text size") as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe("default");
  });

  it("renders a Typeface select defaulting to brand", () => {
    render(
      <SectionStyleControls
        variant={undefined}
        props={baseProps}
        onChange={vi.fn()}
      />,
    );
    const select = screen.getByLabelText("Typeface") as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe("brand");
  });

  it("reflects the current font_size_scale in the select", () => {
    render(
      <SectionStyleControls
        variant={undefined}
        props={{ ...baseProps, font_size_scale: "large" }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Text size")).toHaveValue("large");
  });

  it("reflects the current font_family_preset in the select", () => {
    render(
      <SectionStyleControls
        variant={undefined}
        props={{ ...baseProps, font_family_preset: "serif" }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Typeface")).toHaveValue("serif");
  });

  it("calls onChange with the selected font_size_scale", () => {
    const onChange = vi.fn();
    render(
      <SectionStyleControls
        variant={undefined}
        props={baseProps}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Text size"), { target: { value: "editorial" } });
    expect(onChange).toHaveBeenCalledWith({ font_size_scale: "editorial" });
  });

  it("calls onChange with undefined when Default is selected for Text size", () => {
    const onChange = vi.fn();
    render(
      <SectionStyleControls
        variant={undefined}
        props={{ ...baseProps, font_size_scale: "large" }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Text size"), { target: { value: "default" } });
    expect(onChange).toHaveBeenCalledWith({ font_size_scale: undefined });
  });

  it("calls onChange with the selected font_family_preset", () => {
    const onChange = vi.fn();
    render(
      <SectionStyleControls
        variant={undefined}
        props={baseProps}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Typeface"), { target: { value: "serif" } });
    expect(onChange).toHaveBeenCalledWith({ font_family_preset: "serif" });
  });

  it("calls onChange with undefined when Brand default is selected for Typeface", () => {
    const onChange = vi.fn();
    render(
      <SectionStyleControls
        variant={undefined}
        props={{ ...baseProps, font_family_preset: "serif" }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Typeface"), { target: { value: "brand" } });
    expect(onChange).toHaveBeenCalledWith({ font_family_preset: undefined });
  });
});
