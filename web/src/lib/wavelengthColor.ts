const FALLBACK_COLOR = "#8a98a8";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function adjustChannel(value: number, factor: number) {
  const gamma = 0.8;
  return Math.round(255 * Math.pow(value * factor, gamma));
}

export function wavelengthToVisibleColor(wavelengthNm: number | null | undefined) {
  if (wavelengthNm == null || !Number.isFinite(wavelengthNm)) {
    return FALLBACK_COLOR;
  }

  const wavelength = clamp(wavelengthNm, 380, 780);
  let red = 0;
  let green = 0;
  let blue = 0;

  if (wavelength < 440) {
    red = -(wavelength - 440) / (440 - 380);
    blue = 1;
  } else if (wavelength < 490) {
    green = (wavelength - 440) / (490 - 440);
    blue = 1;
  } else if (wavelength < 510) {
    green = 1;
    blue = -(wavelength - 510) / (510 - 490);
  } else if (wavelength < 580) {
    red = (wavelength - 510) / (580 - 510);
    green = 1;
  } else if (wavelength < 645) {
    red = 1;
    green = -(wavelength - 645) / (645 - 580);
  } else {
    red = 1;
  }

  let factor = 1;
  if (wavelength < 420) {
    factor = 0.3 + (0.7 * (wavelength - 380)) / (420 - 380);
  } else if (wavelength > 700) {
    factor = 0.3 + (0.7 * (780 - wavelength)) / (780 - 700);
  }

  const r = adjustChannel(red, factor);
  const g = adjustChannel(green, factor);
  const b = adjustChannel(blue, factor);
  return `rgb(${r}, ${g}, ${b})`;
}

export function wavelengthColors(wavelengths: Array<number | null | undefined>) {
  return wavelengths.map(wavelengthToVisibleColor);
}
