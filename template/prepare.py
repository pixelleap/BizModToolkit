import re, shutil
src = r"D:\Other\314743529\WPS云盘\金辉的\DSH_workspace\策划\商业化模块工具箱编辑器.html"
dst = r"D:\Other\314743529\WPS云盘\金辉的\DSH_workspace\策划\collab\template\template.html"
html = open(src, encoding="utf-8").read()
names = [
    ("CATEGORIES_DEFAULT", r"const CATEGORIES_DEFAULT = \[.*?\n\];"),
    ("ROWS_DEFAULT", r"const ROWS_DEFAULT = \[.*?\n\];"),
    ("CARD_IDS", r"const CARD_IDS = \[.*?\n\];"),
    ("CARDS_DEFAULT", r"const CARDS_DEFAULT = \[.*?\n\];"),
    ("DEFAULT_DESC", r"const DEFAULT_DESC = \{.*?\n\};"),
    ("BUILTIN_THUMBS", r"const BUILTIN_THUMBS = \{.*?\n\};"),
    ("DEMO_SELECTED", r"const DEMO_SELECTED = \[.*?\];"),
    ("BOOT_PROJECTS", r"const BOOT_PROJECTS = .*?;"),
    ("BUILTIN_THUMB_SEED", r"const BUILTIN_THUMB_SEED = .*?;"),
]
for name, pat in names:
    m = re.search(pat, html, re.S)
    if not m:
        raise SystemExit("missing " + name)
    html = html[:m.start()] + "/* __MB_%s_START__ */\n" % name + m.group(0) + "\n/* __MB_%s_END__ */" % name + html[m.end():]
open(dst, "w", encoding="utf-8", newline="").write(html)
print("template bytes", len(html.encode("utf-8")))