import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ColorField } from "../fields";

describe("ColorField", () => {
  it("renders a hex text input with the correct accessible name", () => {
    render(<ColorField label="Background color" value="#1a6b4a" onChange={vi.fn()} />);
    const textInput = screen.getByLabelText("Background color");
    expect(textInput).toBeInTheDocument();
    expect(textInput).toHaveAttribute("type", "text");
    expect(textInput).toHaveValue("#1a6b4a");
  });

  it("also renders a color picker swatch input", () => {
    const { container } = render(<ColorField label="Test color" value="#ff0000" onChange={vi.fn()} />);
    const picker = container.querySelector('input[type="color"]');
    expect(picker).not.toBeNull();
    expect(picker).toHaveAttribute("value", "#ff0000");
  });

  it("color picker uses the fallback value when hex is incomplete", () => {
    const { container } = render(<ColorField label="Test" value="#abc" onChange={vi.fn()} />);
    const picker = container.querySelector('input[type="color"]');
    // Incomplete hex falls back to #000000 so the browser picker doesn't throw
    expect(picker).toHaveAttribute("value", "#000000");
  });

  it("changing the color picker calls onChange with the new hex", () => {
    const onChange = vi.fn();
    const { container } = render(<ColorField label="Bg" value="#ff0000" onChange={onChange} />);
    const picker = container.querySelector('input[type="color"]') as HTMLInputElement;
    fireEvent.change(picker, { target: { value: "#00ff00" } });
    expect(onChange).toHaveBeenCalledWith("#00ff00");
  });

  it("changing the text input calls onChange with the typed value", () => {
    const onChange = vi.fn();
    render(<ColorField label="Bg" value="#ff0000" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Bg"), { target: { value: "#abc123" } });
    expect(onChange).toHaveBeenCalledWith("#abc123");
  });

  it("shows a validation error and marks the text input aria-invalid", () => {
    render(
      <ColorField
        label="Error color"
        value="not-a-hex"
        error="Must be a hex color like #0f172a."
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Must be a hex color like #0f172a.")).toBeInTheDocument();
    expect(screen.getByLabelText("Error color")).toHaveAttribute("aria-invalid", "true");
  });
});
