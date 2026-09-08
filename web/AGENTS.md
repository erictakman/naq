# Project Instructions

## Stack

- Vinext
- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Rules

- Use TypeScript.
- Prefer existing components over creating duplicates.
- Use shadcn/ui components where appropriate.
- Do not introduce a new dependency without explaining why.
- Keep components small and composable.
- Don't modify generated/config files unnecessarily.
- Follow the existing design tokens.
- Preserve responsive behavior.
- Accessibility is required.

## Design

Paper is the visual source of truth.

When implementing a Paper design:

1. Inspect the relevant Paper frame.
2. Understand its layout hierarchy.
3. Identify reusable components.
4. Map visual patterns to existing shadcn components.
5. Implement the design using the project's existing tokens.
6. Run the app.
7. Compare the implementation against the Paper design.
8. Iterate.

## Before making large changes

Explain:

- what you intend to change
- which files will change
- any architectural implications

Then implement.

## UI components

Before creating a new UI component:

1. Check existing project components.
2. Check `docs/components/` for documented third-party/custom components.
3. Prefer an existing component over recreating the same interaction.
4. Prefer coss components where they fit the project's design system.
5. Use interior.dev components for specialized interaction/animation patterns when appropriate.
6. Use standard shadcn components as the fallback/base.
7. Only build a custom component when the existing options are unsuitable.

For documented components:

- Read the relevant `docs/components/*.md` file.
- Inspect the actual component source before modifying it.
- Treat the local source code as the implementation source of truth.
- Treat the component documentation as guidance for intended usage and integration.
- Preserve existing accessibility, animation, interaction, and responsive behavior unless the task explicitly requires changing it.

Do not install a duplicate component if an equivalent component already exists in the repository.
