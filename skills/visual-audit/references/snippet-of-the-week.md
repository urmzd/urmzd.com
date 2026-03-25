# Snippet of the Week

Every blog post closes with a **"Snippet of the Week"** section — a cross-domain educational tangent wrapped in an `ExploreCard`. This is a core content convention.

## Structure

```mdx
## Snippet of the Week

<ExploreCard client:load title="Topic Title — Subtitle">

Prose explaining the concept and connecting it to the post's theme.

#### The Math (optional)
$$
LaTeX formula here
$$

#### The Code
```language
code snippet demonstrating the concept
```

#### The Connection
Paragraph tying the snippet back to the post's main argument.

</ExploreCard>
```

## Rules

- The snippet must be from a **different domain** than the blog post's primary subject.
- It should include a code sample and/or math formula when applicable.
- The `#### The Connection` section ties the snippet back to the post's theme.
- The `ExploreCard` is collapsed by default (`defaultOpen` defaults to `false`).
- Not all posts have followed this pattern yet — but new posts should include one.
