import { describe, expect, it } from 'vitest'
import compactTimeDisplaysCss from './compact-time-displays.css?raw'
import focusCss from './focus.css?raw'
import pageMigrationCss from './page-migration-v121.css?raw'
import prototypeCss from './prototype.css?raw'

const protectedFocusSelectors = [
  '.focusPage',
  '.focusDial',
  '.focusModeTabs',
  '.focusModeTab',
  '.focusPrototypePanel',
  '.focusTimerActions',
  '.focusHistoryPanel',
]

describe('autoridade visual da página Foco', () => {
  it('mantém os seletores de Foco no ficheiro autoritativo', () => {
    for (const selector of protectedFocusSelectors) {
      expect(focusCss).toContain(selector)
    }
  })

  it('impede que folhas globais antigas voltem a controlar a página Foco', () => {
    const legacyStyleSheets = [prototypeCss, pageMigrationCss, compactTimeDisplaysCss]

    for (const css of legacyStyleSheets) {
      for (const selector of protectedFocusSelectors) {
        expect(css).not.toContain(selector)
      }
    }
  })
})
