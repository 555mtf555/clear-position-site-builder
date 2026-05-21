import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ItemStyleControls } from "../ItemStyleControls";

describe("ItemStyleControls", () => {
  it("renders Text size, Typeface, Weight, text color, and background color controls", () => {
    render(<ItemStyleControls style={undefined} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Item text size")).toBeInTheDocument();
    expect(screen.getByLabelText("Item typeface")).toBeInTheDocument();
    expect(screen.getByLabelText("Item weight")).toBeInTheDocument();
    expect(screen.getByLabelText("Text color")).toBeInTheDocument();
    expect(screen.getByLabelText("Background color")).toBeInTheDocument();
  });

  it("calls onChange with background_color when it changes", () => {
    const onChange = vi.fn();
    render(<ItemStyleControls style={undefined} onChange={onChange} />);
    const { container } = render(<ItemStyleControls style={undefined} onChange={onChange} />);
    const bgInput = container.querySelector('input[aria-label="Background color"]') as HTMLInputElement;
    if (bgInput) {
      fireEvent.change(bgInput, { target: { value: "#255741" } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ background_color: "#255741" }));
    }
  });

  it("shows Default for all selects when style is undefined", () => {
    render(<ItemStyleControls style={undefined} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Item text size")).toHaveValue("default");
    expect(screen.getByLabelText("Item typeface")).toHaveValue("brand");
    expect(screen.getByLabelText("Item weight")).toHaveValue("default");
  });

  it("reflects the current style in the selects", () => {
    render(
      <ItemStyleControls
        style={{ size: "large", font: "serif", weight: "bold" }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Item text size")).toHaveValue("large");
    expect(screen.getByLabelText("Item typeface")).toHaveValue("serif");
    expect(screen.getByLabelText("Item weight")).toHaveValue("bold");
  });

  it("calls onChange with updated style when Text size is changed", () => {
    const onChange = vi.fn();
    render(<ItemStyleControls style={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Item text size"), { target: { value: "display" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ size: "display" }));
  });

  it("calls onChange with updated style when Typeface is changed", () => {
    const onChange = vi.fn();
    render(<ItemStyleControls style={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Item typeface"), { target: { value: "serif" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ font: "serif" }));
  });

  it("calls onChange with undefined font when Brand default is selected", () => {
    const onChange = vi.fn();
    render(<ItemStyleControls style={{ font: "serif" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Item typeface"), { target: { value: "brand" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ font: undefined }));
  });

  it("shows the helper hint about overriding section defaults", () => {
    render(<ItemStyleControls style={undefined} onChange={vi.fn()} />);
    expect(screen.getByText(/Item style overrides section defaults/)).toBeInTheDocument();
  });
});
