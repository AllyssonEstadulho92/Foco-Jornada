export function normalizeNumberInputValue(value: string) {
  return value.replace(/^0+(?=\d)/, '')
}

function handleNumberInput(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLInputElement) || target.type !== 'number') return

  const normalized = normalizeNumberInputValue(target.value)
  if (normalized !== target.value) target.value = normalized
}

let installed = false

export function installNumberInputNormalization() {
  if (installed || typeof document === 'undefined') return
  document.addEventListener('input', handleNumberInput, true)
  installed = true
}
