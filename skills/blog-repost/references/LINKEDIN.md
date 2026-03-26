# LinkedIn Article / Newsletter Formatting

LinkedIn articles support: **bold**, *italic*, headings (h1-h3), links, blockquotes, bulleted/numbered lists. Standalone URLs on their own line generate **rich link preview cards**.

## Adaptations

- **Title:** `# Title` — professional but not bland. LinkedIn rewards strong takes.
- **Subtitle:** One line framing the argument. Draw from `description` or `shareText` frontmatter.
- **Scannable structure:** `###` subheadings liberally. Paragraphs 2-3 sentences max. **Bold** key stats and claims.
- **Data links:** Place source URLs on their own line to generate rich preview cards. Lead with the stat above:

  ```
  Between 1979 and 2025, U.S. productivity grew by **92.4%**. Hourly pay grew by just **33.6%**.

  https://www.epi.org/productivity-pay-gap/
  ```

  This renders as a clickable card with the source's OG image — far more engaging than an inline link.

- **Length:** 500-900 words (tighter — LinkedIn readers scroll fast).
- **CTA:** Italicized: `*Read the full version with interactive visuals at https://urmzd.com/blog/{slug}*`

## Output Structure

```markdown
# Title

Subtitle

Short paragraphs. **Bold key stats.**

### Subheading

More content.

https://standalone-url-for-rich-preview-card.com

### Another section

Content continues.

---

*Read the full version with interactive visuals at https://urmzd.com/blog/{slug}*
```
