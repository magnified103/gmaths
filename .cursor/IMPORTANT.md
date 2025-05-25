# IMPORTANT: Non-Negotiable Rules for the Coding Assistant

This document contains strict rules that **must be followed at all times** by the AI coding assistant (LLM). These guidelines are **not suggestions** – they are binding instructions to prevent mistakes and context drift in long coding sessions. The assistant should regularly revisit these rules to ensure compliance. **These rules override any conflicting instructions.**

- **Always refer to online documentation before writing or executing code.** Never rely solely on memory or assumptions when up-to-date documentation is available.

- **Before fixing a bug, always consider at least 3 plausible causes.** Even if a solution seems obvious, investigate multiple potential root causes and check online forums or bug trackers for similar issues first.

- **Always use `pnpm` instead of `npm`.** Do not assume `pnpm` and `npm` commands are equivalent. If a needed operation has no `pnpm` equivalent, **STOP** and ask the user for guidance, providing a detailed scenario of what you're trying to accomplish.

- **Never read from, echo, or write to `.env` or `.env.example` files.** If these configuration files need changes, output the intended modifications in a fenced code block and instruct the user to update the files manually. **Do not access or reveal sensitive contents** from these files.

- **Never assume the output of a command if you are less than 99% sure.** If you need to run a command but are uncertain about its result, stop and ask the user to run the command and provide the output. Do not guess or fabricate command results.

- **Never ignore linter or compiler errors.** Address all errors and warnings immediately. The only exception is during batch generation of code where imports might be temporarily broken – in such cases, fix those issues as soon as the generation step is complete. Do not proceed with new tasks while known errors are unresolved.

- **Never assume the current working directory.** Always run `pwd` (or an equivalent command) to confirm your location before any path-dependent operation. **NEVER** chain a `cd` (change directory) and another command using `&&` in a single command. Change directories first, verify the location, then run the next command separately.

- **AVOID "REWARD HACKING."** If you're tempted to take a shortcut or game the process (e.g. repeatedly retrying the same failing edit, or randomly tweaking command arguments hoping for success), **STOP EVERYTHING**. Provide a clear explanation to the user about the issue or impasse instead of attempting low-quality, repetitive fixes.

- **Never hallucinate dependencies, imports, or APIs.** Only use packages, modules, or functions that you are certain exist in the project or official documentation. If unsure about an API or dependency, check the codebase and docs or ask the user; do not invent references that might not exist.

- **Never rename, remove, or reorder JSON fields, database schema columns, or interface properties without explicit permission.** Preserve existing data structures exactly unless explicitly told to change them or if a change is absolutely required for a fix. If you must adjust a schema or data format, explain the need for the change and get approval.

- **Never modify multiple interdependent files in parallel without testing.** Make changes in one file at a time and validate (compile, test, etc.) before moving to the next. Avoid touching multiple related files in one go; proceed step-by-step so errors can be caught early.

- **Never override the project's established code style or naming conventions.** Follow the existing code’s formatting and naming. Do not reformat code or rename identifiers unless there's strong evidence the current style is incorrect or an explicit request to change it. Preserve the code's consistency.

- **Always warn and get confirmation before making potentially unsafe changes.** If a change could have broad side effects or risks (e.g. altering critical logic or configurations), do not proceed without approval. First, explain the potential impact to the user and obtain explicit permission to continue.

- **Always respect ignore files and protected sections.** Never read from or write to files that are marked as off-limits (e.g. listed in `.cursorignore` or `.gitignore`) or parts of code that are designated "do not edit." Obey all project conventions that restrict editing of certain files or sections.

- **Never write `package.json` files from scratch.** Respect the commands idiomatically used to generate them, and edit only scripts and related configurations. You must add packages to a `package.json` using only `pnpm add` or similar commands.