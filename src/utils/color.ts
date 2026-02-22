// Parse hex color to RGB values (0-255)
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '')
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  }
}

// Calculate relative luminance (0-1)
// Formula: L = 0.2126*R + 0.7152*G + 0.0722*B (values 0-1)
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255)
}

// Determine if text should be white or dark for contrast
// Use white text if luminance < 0.55, dark (#1a1a2e) otherwise
export function getContrastTextColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor)
  return luminance < 0.55 ? '#ffffff' : '#1a1a2e'
}

// Convert RGB to hex
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Validate hex color
export function isValidHex(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

// Convert hex to rgba string
export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex)
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const l = (max + min) / 2

  if (max === min) {
    return { h: 0, s: 0, l }
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  switch (max) {
    case rNorm:
      h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6
      break
    case gNorm:
      h = ((bNorm - rNorm) / d + 2) / 6
      break
    case bNorm:
      h = ((rNorm - gNorm) / d + 4) / 6
      break
  }

  return { h, s, l }
}

// Convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  if (s === 0) {
    const gray = Math.round(l * 255)
    return rgbToHex(gray, gray, gray)
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  const r = hue2rgb(p, q, h + 1 / 3) * 255
  const g = hue2rgb(p, q, h) * 255
  const b = hue2rgb(p, q, h - 1 / 3) * 255

  return rgbToHex(r, g, b)
}

// Lighten a hex color by percentage (0-1)
export function lightenColor(hex: string, percent: number): string {
  const { h, s, l } = hexToHsl(hex)
  const newL = Math.min(1, l + (1 - l) * percent)
  return hslToHex(h, s, newL)
}

// Darken a hex color by percentage (0-1)
export function darkenColor(hex: string, percent: number): string {
  const { h, s, l } = hexToHsl(hex)
  const newL = Math.max(0, l * (1 - percent))
  return hslToHex(h, s, newL)
}
