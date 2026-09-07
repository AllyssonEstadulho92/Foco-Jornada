import { describe, expect, it } from 'vitest'

const cssSources = import.meta.glob('./*.css', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const presentationSources = import.meta.glob('../presentation/**/*.{ts,tsx}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const securitySources = import.meta.glob('../security/**/*.{ts,tsx}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const runtimeSources = { ...presentationSources, ...securitySources }

const allowedInlineSvgSources = new Set([
  '../presentation/components/brand/GloLogo.tsx',
  '../presentation/components/ui/AppIcon.tsx',
  '../presentation/pages/TodayReferencePage.tsx',
])

function numericDeclarations(source: string, property: string, unit: string): number[] {
  const expression = new RegExp(`${property}\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)${unit}`, 'gi')
  return Array.from(source.matchAll(expression), (match) => Number(match[1]))
}

describe('autoridade visual da aplicação', () => {
  it('não mantém texto CSS abaixo de 12 px equivalentes', () => {
    const violations: string[] = []

    for (const [path, source] of Object.entries(cssSources)) {
      for (const value of numericDeclarations(source, 'font-size', 'px')) {
        if (value < 12) violations.push(`${path}: ${value}px`)
      }
      for (const value of numericDeclarations(source, 'font-size', 'rem')) {
        if (value < 0.75) violations.push(`${path}: ${value}rem`)
      }
      for (const value of numericDeclarations(source, 'font-size', 'pt')) {
        if (value < 9) violations.push(`${path}: ${value}pt`)
      }
    }

    expect(violations).toEqual([])
  })

  it('mantém pesos tipográficos num conjunto normalizado', () => {
    const violations: string[] = []
    const expression = /font-weight\s*:\s*([0-9]{3})/gi

    for (const [path, source] of Object.entries(cssSources)) {
      for (const match of source.matchAll(expression)) {
        const value = Number(match[1])
        if (![400, 500, 600, 700].includes(value)) violations.push(`${path}: ${value}`)
      }
    }

    expect(violations).toEqual([])
  })

  it('não define famílias tipográficas locais fora dos tokens', () => {
    const violations: string[] = []
    const expression = /font-family\s*:\s*([^;}]+)/gi

    for (const [path, source] of Object.entries(cssSources)) {
      for (const match of source.matchAll(expression)) {
        const value = match[1].trim()
        if (!value.startsWith('var(--font-')) violations.push(`${path}: ${value}`)
      }
    }

    expect(violations).toEqual([])
  })

  it('não usa glifos Unicode conhecidos como substitutos de ícones', () => {
    const forbidden = /[✓◷☕↻↗○▣◎⊙▤⚡]/u
    const violations = Object.entries({ ...runtimeSources, ...cssSources })
      .filter(([, source]) => forbidden.test(source))
      .map(([path]) => path)

    expect(violations).toEqual([])
  })

  it('limita SVG inline a AppIcon, ilustração principal e marca glo', () => {
    const violations = Object.entries(runtimeSources)
      .filter(([path, source]) => source.includes('<svg') && !allowedInlineSvgSources.has(path))
      .map(([path]) => path)

    expect(violations).toEqual([])
  })
})
