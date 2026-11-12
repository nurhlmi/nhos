@AGENTS.md

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `DESIGN.md` first for direction, then load the antislop plugin skills (installed as the Claude Code plugin `antislop@anti-slop`): `antislop:antislop` (core) and then the skill for the task:
- UI / visual: `antislop:antislop-ui`
- Copy & text: `antislop:antislop-copywriting`
- People: `antislop:antislop-human`
- Mobile / responsive: `antislop:antislop-layoutmobile`
- Code comments: `antislop:antislop-code`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
Run the core's Delivery Gate and report it as PASS/FAIL before delivering UI work. Audit reports go in `anti-slop/`.
To update antislop later: `claude plugin update antislop@anti-slop`.
<!-- antislop:end -->
