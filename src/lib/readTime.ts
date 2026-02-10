export function calculateReadTime(content: string, wordsPerMinute = 225) {
  const plainText = content
    .replace(/^import\s+.*$/gm, '') // Remove MDX import statements
    .replace(/^export\s+.*$/gm, '') // Remove MDX export statements
    .replace(/\$\$[\s\S]*?\$\$/g, '') // Remove LaTeX display math
    .replace(/\$[^$\n]*\$/g, '') // Remove LaTeX inline math
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Links -> text only
    .replace(/<[^>]*>/g, '') // Remove HTML
    .replace(/^---[\s\S]*?---/m, ''); // Remove frontmatter

  const words = plainText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const min = Math.floor(words.length / wordsPerMinute) || 1;
  const max = Math.ceil(words.length / wordsPerMinute) || 1;
  const text = min === max ? `${min} min read` : `${min}-${max} min read`;
  return { minutes: max, text };
}
