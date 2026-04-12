export function calculateReadTime(content: string, wordsPerMinute = 250) {
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
    .replace(/^---[\s\S]*?---/, ''); // Remove frontmatter

  const words = plainText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const minutes = Math.ceil(words.length / wordsPerMinute) || 1;
  const text = `${minutes} min read`;
  return { minutes, text };
}
