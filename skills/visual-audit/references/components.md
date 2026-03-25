# Available components for MDX blog posts

Components must be hydrated with `client:load` (immediate) or `client:visible` (lazy, when scrolled into view).

| Component | Purpose | Hydration | Usage |
|-----------|---------|-----------|-------|
| `PreviewLink` | External link with hover preview card | `client:load` | `<PreviewLink client:load href="...">text</PreviewLink>` |
| `ExploreCard` | Collapsible card for supplementary content (Snippet of the Week) | `client:load` | `<ExploreCard client:load title="...">children</ExploreCard>` |
| `Aside` | Side-note or callout box | `client:load` | `<Aside client:load title="...">children</Aside>` |
| `BlockQuote` | Styled quotation with author/source attribution | `client:load` | `<BlockQuote client:load author="..." source="...">text</BlockQuote>` |
| `PullQuote` | Large emphasized inline quote | `client:load` | `<PullQuote client:load>text</PullQuote>` |
| `Collapsible` | Generic collapsible section | `client:load` | `<Collapsible client:load title="...">children</Collapsible>` |
| `YouTubeEmbed` | YouTube video embed | `client:load` | `<YouTubeEmbed client:load id="VIDEO_ID" title="..." />` |
| `ChatDemo` | Interactive AI chat demonstration | `client:visible` | `<ChatDemo client:visible />` |
| `Phonetic` | IPA pronunciation display | `client:load` | `<Phonetic client:load ipa="..." />` |
| `ScriptInline` | Script/alphabet transliteration | `client:load` | `<ScriptInline client:load letters="..." targetScript="..." />` |
| `GPEvolutionVisualizer` | Animated genetic programming visualization | `client:visible` | `<GPEvolutionVisualizer client:visible />` |
| `CriticalThinkingLoop` | Animated loop diagram | `client:visible` | `<CriticalThinkingLoop client:visible />` |
| `FirstPrinciplesVisual` | First principles breakdown visual | `client:visible` | `<FirstPrinciplesVisual client:visible />` |
| `ConfirmationBiasVisual` | Confirmation bias illustration | `client:visible` | `<ConfirmationBiasVisual client:visible />` |
| `ExtrapolationVisual` | Extrapolation concept visual | `client:visible` | `<ExtrapolationVisual client:visible />` |
| `ConsilienceVisual` | Consilience concept visual | `client:visible` | `<ConsilienceVisual client:visible />` |
| `SearchLandscapeVisual` | Search landscape optimization visual | `client:visible` | `<SearchLandscapeVisual client:visible />` |
| `Cite` | Inline citation linking to reference list | none | `<Cite id={1} />` |
| `References` | Rendered reference list with back-links | none | `<References items={[...]} />` |

**Import patterns:**
- Individual: `import PreviewLink from '../components/PreviewLink';`
- Barrel: `import { BlockQuote, PreviewLink, ExploreCard } from '../components';`
