from pathlib import Path
import re

CSS_DIR = Path('src/styles')


def normalize_rule(selector: str, body: str) -> str:
    headings = set(re.findall(r'\bh([1-4])\b', selector, flags=re.I))
    heading_token = {
        '1': ('var(--text-2xl)', 'var(--weight-bold)'),
        '2': ('var(--text-lg)', 'var(--weight-semibold)'),
        '3': ('var(--text-base)', 'var(--weight-semibold)'),
        '4': ('var(--text-base)', 'var(--weight-semibold)'),
    }

    if len(headings) == 1:
        level = next(iter(headings))
        size, weight = heading_token[level]
        body = re.sub(r'font-size\s*:\s*[^;}]+', f'font-size: {size}', body, flags=re.I)
        body = re.sub(r'font-weight\s*:\s*[^;}]+', f'font-weight: {weight}', body, flags=re.I)

    interactive = re.search(
        r'(button|input|select|textarea|summary|\.navLink\b|\.mobileQuickLink\b|\ba\b)',
        selector,
        flags=re.I,
    )
    if interactive:
        def minimum(match: re.Match[str]) -> str:
            value = float(match.group('value'))
            if value >= 44:
                return match.group(0)
            important = match.group('important') or ''
            return f"min-height: var(--control-height-compact){important}"

        body = re.sub(
            r'min-height\s*:\s*(?P<value>[0-9]+(?:\.[0-9]+)?)px(?P<important>\s*!important)?',
            minimum,
            body,
            flags=re.I,
        )

    direct_button = any(
        re.search(r'(?:\bbutton|\.[\w-]*Button)(?:[:\[].*)?$', part.strip(), flags=re.I)
        for part in selector.split(',')
    ) and '::before' not in selector and '::after' not in selector

    if direct_button:
        def dimension(match: re.Match[str]) -> str:
            property_name = match.group('property')
            value = float(match.group('value'))
            if value >= 44:
                return match.group(0)
            important = match.group('important') or ''
            return f"{property_name}: var(--control-height-compact){important}"

        body = re.sub(
            r'(?P<property>(?:min-)?(?:width|height))\s*:\s*(?P<value>[0-9]+(?:\.[0-9]+)?)px(?P<important>\s*!important)?',
            dimension,
            body,
            flags=re.I,
        )
        body = re.sub(
            r'flex\s*:\s*0\s+0\s+(?P<value>[0-9]+(?:\.[0-9]+)?)px(?P<important>\s*!important)?',
            lambda match: (
                f"flex: 0 0 var(--control-height-compact){match.group('important') or ''}"
                if float(match.group('value')) < 44
                else match.group(0)
            ),
            body,
            flags=re.I,
        )

    return body


def normalize_stylesheet(source: str) -> str:
    pattern = re.compile(r'(?P<selector>[^{}]+)\{(?P<body>[^{}]*)\}', flags=re.S)

    def rewrite(match: re.Match[str]) -> str:
        selector = match.group('selector')
        body = match.group('body')
        return f"{selector}{{{normalize_rule(selector, body)}}}"

    return pattern.sub(rewrite, source)


changed = []
for path in sorted(CSS_DIR.glob('*.css')):
    original = path.read_text(encoding='utf-8')
    text = normalize_stylesheet(original)

    if path.name == 'history.css':
        replacements = {
            'width: 18px;': 'width: var(--icon-size);',
            'height: 18px;': 'height: var(--icon-size);',
            'width: 15px;': 'width: var(--icon-size);',
            'height: 15px;': 'height: var(--icon-size);',
            'fill: currentColor;': 'fill: none;',
        }
        for old, new in replacements.items():
            text = text.replace(old, new)

    if text != original:
        path.write_text(text, encoding='utf-8')
        changed.append(str(path))

print(f'Folhas ajustadas: {len(changed)}')
for item in changed:
    print(f'- {item}')
