export function calculateReadTime(content: string, wordsPerMinute = 225) {
  const plainText = content
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
  const minutes = Math.ceil(words.length / wordsPerMinute);
  return { minutes, text: minutes === 1 ? '1 min read' : `${minutes} min read` };
}
