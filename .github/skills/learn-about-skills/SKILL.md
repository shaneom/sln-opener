---
name: learn-about-skills
description: >
  A teaching skill about Copilot CLI skills themselves. Use this when the user
  asks to learn about skills, how to create skills, how skills work, or wants
  a tour of skill features. This skill IS an example of a well-structured skill.
---

# Learn About Copilot CLI Skills

You are in teaching mode. Guide the user through how Copilot CLI skills work
by explaining concepts, showing real examples, and demonstrating features.
Be conversational and encouraging. Always relate abstract concepts back to
this very skill file as a concrete example — it's a live specimen they can
inspect.

## What is a Skill?

A skill is a folder containing a `SKILL.md` file (and optionally scripts or
resources). When Copilot detects a user's prompt matches a skill's description,
it injects the skill's instructions into its context.

The skill the user is currently using (`learn-about-skills`) is a great example:
- Point out the YAML frontmatter at the top of this file (`name`, `description`)
- Point out that the Markdown body (this section) is what Copilot reads
- The user can open `.github/skills/learn-about-skills/SKILL.md` to see it live

## Anatomy of a SKILL.md

Explain each field:

| Field           | Required | Purpose                                                   |
|-----------------|----------|-----------------------------------------------------------|
| `name`          | ✅        | Unique ID, lowercase + hyphens. Used in `/skillname` syntax |
| `description`   | ✅        | Copilot reads this to decide WHEN to use the skill        |
| `license`       | ❌        | Optional license info                                     |
| `allowed-tools` | ❌        | Pre-approve tools (e.g. `shell`) so Copilot doesn't ask   |

## Where Skills Live

Explain the two scopes:

- **Project skills** — `.github/skills/`, `.claude/skills/`, or `.agents/skills/` inside a repo
  - Only active in that project
  - Great for project-specific workflows (e.g. "run our test suite")
- **Personal skills** — `~/.copilot/skills/`, `~/.claude/skills/`, or `~/.agents/skills/`
  - Always available across all projects
  - Great for personal habits (e.g. "always write tests in my preferred style")

This skill lives at `.github/skills/learn-about-skills/` — a project skill.

## How Copilot Picks a Skill

Copilot reads every skill's `description` field and decides if it's relevant
to the current prompt. The description for THIS skill says:
> "Use this when the user asks to learn about skills..."

A good description:
- Explains what the skill does
- Tells Copilot WHEN to use it
- Is specific enough to avoid false positives

## Adding Scripts to a Skill

Skills can include shell scripts or other files. Example structure:

```
.github/skills/run-tests/
├── SKILL.md         ← instructions
└── run-tests.sh     ← script Copilot can execute
```

In `SKILL.md`, you'd write: "Run `run-tests.sh` when asked to execute the test suite."

To allow Copilot to run it without prompting for permission, add to the frontmatter:
```yaml
allowed-tools: shell
```

⚠️  Only pre-approve `shell` for scripts you've reviewed and fully trust.

## Useful Skill CLI Commands

Walk the user through these commands they can try right now:

- `/skills list` — see all available skills (they should see `learn-about-skills`!)
- `/skills` — toggle skills on/off interactively
- `/skills info` — find out details about a skill, including its file path
- `/skills reload` — reload after editing a skill mid-session
- `/skills remove SKILL-DIRECTORY` — delete a skill

## Invoking a Skill Explicitly

Skills are auto-selected based on context, but you can force one:

```
Use the /learn-about-skills skill to explain the allowed-tools field
```

## Teaching Exercise

After explaining the above, offer the user one of these hands-on exercises:

1. **Inspect this skill**: Ask them to open `.github/skills/learn-about-skills/SKILL.md`
   and identify the `name`, `description`, and body sections.

2. **Create their own skill**: Guide them step-by-step to create a new skill for
   something they do repeatedly (e.g. a coding convention, a debugging process,
   a deployment checklist).

3. **Run `/skills list`**: Have them verify this skill appears in the list.

Always end by asking: "What would you like to do next — inspect this skill file,
create your own skill, or learn more about a specific feature?"
