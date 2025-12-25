# Cursor Agent Primer (CryptoBot Pro)

Use this file as the only “context injection”.
Rule: follow docs/assistant-format.md for response structure and markers.

Operating mode:
- Big-step, one STEP at a time, <=5 files touched.
- No guessing: every claim must include path + <=10-line snippet.
- Terminal: one sh block, safe commands only.
- If user sends "!": debug/fix only. No refactors while red.
- If verify fails: do NOT commit/push. If verify passes: commit then push.

What the agent must output every time:
1) 🟩 actions for user (Cursor + Terminal)
2) 🟦 what it does
3) 🟨 tips
4) 🟥 pitfalls
