v1 = open('.planning/research/SUMMARY.md', 'r', encoding='utf-8').read()
header = open('.planning/research/summary_v2_header.txt', 'r', encoding='utf-8').read()
footer = "<details>\n<summary>v1.0 Research (Wallecx Phase 1 - Vaccination Records, 2026-05-10)</summary>\n\n" + v1.strip() + "\n\n</details>\n\n---\n*v2.0 research synthesized: 2026-05-13*\n*Ready for roadmap: yes*\n"
with open('.planning/research/SUMMARY.md', 'w', encoding='utf-8') as f:
    f.write(header + footer)
print('done', len(header + footer))
