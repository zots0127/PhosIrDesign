import { describe, expect, it } from "vitest";
import { wavelengthColors, wavelengthToVisibleColor } from "./wavelengthColor";

describe("wavelength color helpers", () => {
  it("maps representative visible wavelengths to intuitive colors", () => {
    expect(wavelengthToVisibleColor(450)).toBe("rgb(0, 70, 255)");
    expect(wavelengthToVisibleColor(530)).toBe("rgb(94, 255, 0)");
    expect(wavelengthToVisibleColor(610)).toBe("rgb(255, 155, 0)");
    expect(wavelengthToVisibleColor(660)).toBe("rgb(255, 0, 0)");
  });

  it("uses a stable fallback for missing wavelengths", () => {
    expect(wavelengthColors([null, undefined, Number.NaN])).toEqual(["#8a98a8", "#8a98a8", "#8a98a8"]);
  });

  it("clamps near-infrared values to the red edge of the visible scale", () => {
    expect(wavelengthToVisibleColor(900)).toBe(wavelengthToVisibleColor(780));
  });
});
