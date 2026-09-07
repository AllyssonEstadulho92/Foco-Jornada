from pathlib import Path
import re


def read(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    Path(path).write_text(text, encoding="utf-8")


def replace_required(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: esperado 1, encontrado {count}")
    return text.replace(old, new, 1)


def regex_required(text: str, pattern: str, replacement: str, label: str) -> str:
    result, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"{label}: esperado 1, encontrado {count}")
    return result


# AppIcon: autoridade única para ícones funcionais.
path = "src/presentation/components/ui/AppIcon.tsx"
text = read(path)
text = replace_required(
    text,
    "  | 'refresh'\n  | 'theme'",
    "  | 'refresh'\n  | 'backspace'\n  | 'route'\n  | 'circle'\n  | 'theme'",
    "nomes AppIcon",
)
marker = "  if (name === 'theme') {"
additions = """  if (name === 'backspace') {
    return <>
      <path d=\"M9 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-6-6 6-6Z\" />
      <path d=\"m12 9 5 6M17 9l-5 6\" />
    </>
  }
  if (name === 'route') {
    return <>
      <circle cx=\"6\" cy=\"18\" r=\"2\" />
      <circle cx=\"18\" cy=\"6\" r=\"2\" />
      <path d=\"M8 18h2a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3\" />
    </>
  }
  if (name === 'circle') {
    return <circle cx=\"12\" cy=\"12\" r=\"8.5\" />
  }
"""
text = replace_required(text, marker, additions + marker, "casos AppIcon")
write(path, text)

# Histórico: relógio e lixo usam AppIcon em vez de SVG local.
path = "src/presentation/pages/HistoryPage.tsx"
text = read(path)
text = regex_required(
    text,
    r'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1\.8">\s*<circle cx="12" cy="12" r="8\.5" />\s*<path d="M12 7v5l3\.5 2" />\s*</svg>',
    '<AppIcon name="history" />',
    "ícone histórico",
)
text = regex_required(
    text,
    r'<svg viewBox="0 0 24 24" aria-hidden="true">\s*<path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-\.7 11H7\.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" />\s*</svg>',
    '<AppIcon name="trash" />',
    "ícone eliminar histórico",
)
write(path, text)

# Notificações: elimina o glifo de check remanescente.
path = "src/presentation/pages/NotificationCenterPage.tsx"
text = read(path)
text = replace_required(
    text,
    ">✓</span>",
    "><AppIcon name={capability.serviceWorkerRegistered ? 'check' : 'warning'} /></span>",
    "estado Service Worker",
)
write(path, text)

# Sobre: todos os pictogramas passam pelo mesmo sistema.
path = "src/presentation/components/AppAboutSettings.tsx"
text = read(path)
text = replace_required(
    text,
    '<span className="referenceAboutInfoIcon" aria-hidden="true">i</span>',
    '<span className="referenceAboutInfoIcon" aria-hidden="true"><AppIcon name="info" /></span>',
    "ícone informação",
)
text = replace_required(
    text,
    "{versionState === 'checking' ? 'A verificar…' : standalone ? 'Instalada · ↻' : 'Navegador · ↻'}",
    "{versionState === 'checking' ? 'A verificar…' : (<>\n                <span>{standalone ? 'Instalada' : 'Navegador'}</span>\n                <AppIcon name=\"refresh\" />\n              </>)}",
    "ícone atualizar",
)
text = replace_required(text, '<span className="referenceBrandMeaningIcon" aria-hidden="true">◷</span>', '<span className="referenceBrandMeaningIcon" aria-hidden="true"><AppIcon name="clock" /></span>', "marca relógio")
text = replace_required(text, '<span className="referenceBrandMeaningIcon" aria-hidden="true">↗</span>', '<span className="referenceBrandMeaningIcon" aria-hidden="true"><AppIcon name="route" /></span>', "marca percurso")
text = replace_required(text, '<span className="referenceBrandMeaningIcon" aria-hidden="true">○</span>', '<span className="referenceBrandMeaningIcon" aria-hidden="true"><AppIcon name="circle" /></span>', "marca forma")
write(path, text)

# Relatório A4: pictogramas tipográficos deixam de representar ações/conceitos.
path = "src/presentation/pages/ExportDataPage.tsx"
text = read(path)
for old, new in {
    '<span>▣ {formatReportDate(date)}</span>': '<span><AppIcon name="calendar" />{formatReportDate(date)}</span>',
    '<dt>◷ Jornada planeada</dt>': '<dt><AppIcon name="journey" />Jornada planeada</dt>',
    '<dt>☕ Pausas</dt>': '<dt><AppIcon name="break" />Pausas</dt>',
    '<dt>◎ Tempo efetivo</dt>': '<dt><AppIcon name="clock" />Tempo efetivo</dt>',
    '<dt>⊙ Foco total</dt>': '<dt><AppIcon name="focus" />Foco total</dt>',
    '<dt>▤ Atividades concluídas</dt>': '<dt><AppIcon name="activities" />Atividades concluídas</dt>',
    '<dt>☕ Cafés</dt>': '<dt><AppIcon name="coffee" />Cafés</dt>',
}.items():
    text = replace_required(text, old, new, old)
write(path, text)

# Segurança: backspace é AppIcon.
path = "src/security/SecurityGate.tsx"
text = read(path)
text = replace_required(
    text,
    "import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'\n",
    "import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'\nimport { AppIcon } from '../presentation/components/ui/AppIcon'\n",
    "import AppIcon segurança",
)
text = regex_required(
    text,
    r'<svg className="securityBackspaceIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1\.8"[^>]*>.*?</svg>',
    '<AppIcon name="backspace" className="securityBackspaceIcon" />',
    "backspace segurança",
)
write(path, text)

# Sticks: estado usa check/clock e remove pictogramas de pseudo-elementos.
path = "src/presentation/pages/SticksStockPage.tsx"
text = read(path)
text = replace_required(
    text,
    '<span><AppIcon name="check" /> INTERVALO CONSCIENTE</span>',
    '<span>{displayedPacingStatus.ready ? <AppIcon name="check" /> : <AppIcon name="clock" />} INTERVALO CONSCIENTE</span>',
    "estado intervalo consciente",
)
write(path, text)

for path, patterns in {
    "src/styles/sticks-pacing-reference.css": [
        r'\.sticksLinearPage \.sticksPacingClock\.isWaiting \.sticksPacingCopy > span::before\s*\{.*?\}',
        r'\.sticksLinearPage \.sticksPacingZeroButton::before\s*\{.*?\}',
    ],
    "src/styles/sticks-control-v2.css": [
        r'\.sticksLinearPage \.sticksPacingClock\.isReady \.sticksPacingDialFace strong::before\s*\{.*?\}',
    ],
}.items():
    text = read(path)
    for pattern in patterns:
        text = regex_required(text, pattern, "", f"pseudo-ícone {path}")
    write(path, text)

# Famílias tipográficas diretas antigas.
path = "src/styles/more-redesign.css"
text = read(path)
text = text.replace("  font-family: ui-serif, Georgia, serif;\n", "")
write(path, text)

path = "src/styles/medication-protection.css"
text = read(path)
text = re.sub(
    r'font-family:\s*ui-monospace,\s*SFMono-Regular,\s*Menlo,\s*Monaco,\s*Consolas,\s*monospace;',
    "font-family: var(--font-mono);",
    text,
)
write(path, text)

path = "src/styles/export-a4.css"
text = read(path)
text = text.replace('font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif', 'font-family:var(--font-sans)')
text += "\n.exportA4DocumentMeta>span,.exportA4DaySummary dt{display:flex;align-items:center;gap:6px}.exportA4DocumentMeta .appIcon,.exportA4DaySummary dt .appIcon{width:14px;height:14px;flex:0 0 14px}\n"
write(path, text)

# Fallback de bootstrap segue a mesma família.
for path in ["index.html", "src/index.html"]:
    text = read(path)
    text = text.replace(
        "font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;",
        "font-family: 'Inter Variable', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;",
    )
    write(path, text)

# Limpeza do CSS central de ícones.
path = "src/styles/icons.css"
text = read(path)
text = regex_required(text, r'\n@keyframes appIconClapper \{.*?\n\}\n', "\n", "keyframe redundante")
text += "\n.referenceAboutInfoIcon .appIcon,.referenceBrandMeaningIcon .appIcon,.referenceVersionBadgeButton .appIcon{width:var(--icon-size);height:var(--icon-size)}\n.securityBackspaceIcon{width:var(--icon-size-primary);height:var(--icon-size-primary)}\n"
write(path, text)
