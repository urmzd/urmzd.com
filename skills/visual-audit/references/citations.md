# Citation system

Blog posts with references use two components for dynamic linking between inline citations and the reference list.

## Inline citation — `Cite`

```mdx
import Cite from '../components/Cite';

...learned from massive training datasets<Cite id={1} />.
```

Renders as a superscript `[1]` linking to `#ref-1`. The element has `id="cite-1"` so the reference list can link back.

## Reference list — `References`

```mdx
import References from '../components/References';

<References items={[
  { id: 1, text: 'Author. "Title." Source, Year.', url: "https://..." },
  { id: 2, text: 'Author. "Title." Source, Year.', url: "https://..." },
]} />
```

Renders a styled `<ol>` where each `[N]` links back to `#cite-N` in the body, and each entry's URL is a clickable external link.

## Rules

- `Cite` and `References` do not need `client:load` — they are static markup with no interactivity.
- `id` values must be consistent between `Cite` and `References` items.
- Place `<References>` at the very end of the post, after the `---` separator.
- The `text` field should contain the full citation text (author, title, source, year) without the URL — the URL is rendered separately.
