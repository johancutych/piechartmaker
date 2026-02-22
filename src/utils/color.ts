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
