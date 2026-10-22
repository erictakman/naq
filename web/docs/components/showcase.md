# Component showcase

Route: `/components`. Source: `src/components/blocks/showcase/`.

Every primitive in `components/ui`, every Paper block and the lab components,
grouped into chapters, with a scroll-spying sidebar and a light/dark switch.
The Foundations chapter prints each colour token as the hex the browser
actually paints, so values can be copied into Paper for either theme.

## Adding a component

1. Put a `<Specimen name="…" source="ui/…">` in the chapter that fits
   (`*-section.tsx`). Pass `wide` to span both columns.
2. A new chapter is a new `*-section.tsx` plus one entry in `chapterGroups`
   in `showcase-page.tsx`. That list drives both the sidebar and the page.

## Notes

- Toasts need `ToastProvider`; it wraps this route in `routes/components.tsx`.
- Shadows and radii are shown through their utility classes, because
  `@theme inline` tokens are not emitted as CSS variables at runtime.
