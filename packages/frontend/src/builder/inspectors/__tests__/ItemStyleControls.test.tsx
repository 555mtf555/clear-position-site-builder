import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ItemStyleControls } from "../ItemStyleControls";
import { TextFieldStyleControls } from "../TextFieldStyleControls";

describe("ItemStyleControls — card surface (background only)", () => {
  it("renders only the Card background color control", () => {
    render(<ItemStyleControls style={undefined} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Card background")).toBeInTheDocument();
    // Text style controls are no longer in ItemStyleControls
    expect(screen.queryByLabelText("Item text size")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Item typeface")).not.toBeInTheDocument();
  });

  it("calls onChange with background_color when it changes", () => {
    const onChange = vi.fn();
    const { container } = render(<ItemStyleControls style={undefined} onChange={onChange} />);
    const bgInput = container.querySelector('input[aria-label="Card background"]') as HTMLInputElement;
    if (bgInput) {
      fireEvent.change(bgInput, { target: { value: "#255741" } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ background_color: "#255741" }));
    }
  });

  it("shows the card surface hint text", () => {
    render(<ItemStyleControls style={undefined} onChange={vi.fn()} />);
    expect(screen.getByText(/card surface/i)).toBeInTheDocument();
  });
});

describe("TextFieldStyleControls — per-field text styling", () => {
  it("renders Text size, Typeface, Weight, and Color controls", () => {
    render(<TextFieldStyleControls style={undefined} onChange={vi.fn()} />);
    expect(screen.getByLabelText("field text size")).toBeInTheDocument();
    expect(screen.getByLabelText("field typeface")).toBeInTheDocument();
    expect(screen.getByLabelText("field weight")).toBeInTheDocument();
    expect(screen.getByLabelText("Color")).toBeInTheDocument();
  });

  it("uses the fieldLabel prop for aria-labels", () => {
    render(<TextFieldStyleControls fieldLabel="title" style={undefined} onChange={vi.fn()} />);
    expect(screen.getByLabelText("title text size")).toBeInTheDocument();
    expect(screen.getByLabelText("title typeface")).toBeInTheDocument();
  });

  it("shows Default when style is undefined", () => {
    render(<TextFieldStyleControls style={undefined} onChange={vi.fn()} />);
    expect(screen.getByLabelText("field text size")).toHaveValue("default");
    expect(screen.getByLabelText("field typeface")).toHaveValue("brand");
    expect(screen.getByLabelText("field weight")).toHaveValue("default");
  });

  it("reflects the current style in the selects", () => {
    render(
      <TextFieldStyleControls
        fieldLabel="title"
        style={{ size: "large", font: "serif", weight: "bold" }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("title text size")).toHaveValue("large");
    expect(screen.getByLabelText("title typeface")).toHaveValue("serif");
    expect(screen.getByLabelText("title weight")).toHaveValue("bold");
  });

  it("calls onChange when Text size is changed", () => {
    const onChange = vi.fn();
    render(<TextFieldStyleControls fieldLabel="desc" style={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("desc text size"), { target: { value: "large" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ size: "large" }));
  });

  it("calls onChange when Typeface is changed to serif", () => {
    const onChange = vi.fn();
    render(<TextFieldStyleControls fieldLabel="q" style={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("q typeface"), { target: { value: "serif" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ font: "serif" }));
  });

  it("sets font to undefined when Brand default is selected", () => {
    const onChange = vi.fn();
    render(<TextFieldStyleControls fieldLabel="q" style={{ font: "serif" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("q typeface"), { target: { value: "brand" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ font: undefined }));
  });
});
