from pathlib import Path


def update(path: str, replacements: dict[str, str]) -> None:
    target = Path(path)
    text = target.read_text(encoding='utf-8')
    original = text
    for old, new in replacements.items():
        if old not in text:
            raise RuntimeError(f'{path}: trecho não encontrado: {old[:80]}')
        text = text.replace(old, new, 1)
    if text == original:
        raise RuntimeError(f'{path}: nenhuma alteração aplicada')
    target.write_text(text, encoding='utf-8')


update(
    'src/styles/compact-time-displays.css',
    {
        "  .appTopBar{\n    min-height:54px!important;\n    align-items:center!important;\n    padding:7px max(12px,env(safe-area-inset-right)) 7px max(12px,env(safe-area-inset-left))!important;\n  }":
        "  .appTopBar{\n    min-height:calc(64px + env(safe-area-inset-top))!important;\n    align-items:center!important;\n    padding:max(var(--space-2),env(safe-area-inset-top)) max(var(--page-padding-mobile),env(safe-area-inset-right)) var(--space-2) max(var(--page-padding-mobile),env(safe-area-inset-left))!important;\n  }",
        "    flex-basis:36px;": "    flex-basis:var(--control-height-compact);",
    },
)

update(
    'src/styles/history.css',
    {
        "  gap: 20px;\n  margin-bottom: 20px;": "  gap: var(--space-5);\n  margin-bottom: var(--space-5);",
        "  font-size: 13px;\n  line-height: 1.45;": "  font-size: var(--text-sm);\n  line-height: var(--line-height-normal);",
        "  gap: 10px;\n  min-height: 44px;": "  gap: var(--space-2);\n  min-height: var(--control-height-compact);",
        "  font-size: 13px;\n  font-weight: var(--weight-bold);": "  font-size: var(--text-sm);\n  font-weight: var(--weight-medium);",
        "  padding: 18px;": "  padding: var(--card-padding);",
        "  padding: 4px 18px;": "  padding: var(--space-1) var(--space-4);",
        "  font-weight: var(--weight-bold);\n}\n\n.historySummaryMetric strong": "  font-weight: var(--weight-medium);\n}\n\n.historySummaryMetric strong",
        "  padding: 18px;\n  border: 1px solid var(--line);": "  padding: var(--card-padding);\n  border: 1px solid var(--line);",
        "  font-size: 17px;": "  font-size: var(--text-lg);",
        "  font-weight: var(--weight-bold);\n}\n\n.historyTimelineList": "  font-weight: var(--weight-medium);\n}\n\n.historyTimelineList",
        "  font-weight: var(--weight-bold);\n  font-variant-numeric: tabular-nums;": "  font-weight: var(--weight-medium);\n  font-variant-numeric: tabular-nums;",
        "  font-size: 13px;\n  text-overflow: ellipsis;": "  font-size: var(--text-sm);\n  font-weight: var(--weight-medium);\n  text-overflow: ellipsis;",
    },
)
