import db from './db';

export interface KnowledgeDocResult {
  id: string;
  title: string;
  category: string;
  content: string;
}

export async function searchKnowledgeBase(query: string): Promise<KnowledgeDocResult[]> {
  if (!query || query.trim() === '') {
    // Return standard top articles if query is empty
    const defaultDocs = await db.knowledgeDocument.findMany({
      take: 3
    });
    return defaultDocs.map(d => ({
      id: d.id,
      title: d.title,
      category: d.category,
      content: d.content
    }));
  }

  const cleanQuery = query.trim().toLowerCase();
  const keywords = cleanQuery.split(/\s+/).filter(k => k.length > 2);

  if (keywords.length === 0) {
    // Fallback to simple matching of entire query
    const fallbackDocs = await db.knowledgeDocument.findMany({
      where: {
        OR: [
          { title: { contains: cleanQuery, mode: 'insensitive' as const } },
          { content: { contains: cleanQuery, mode: 'insensitive' as const } }
        ]
      },
      take: 3
    });
    return fallbackDocs.map(d => ({
      id: d.id,
      title: d.title,
      category: d.category,
      content: d.content
    }));
  }

  // Create OR query matching any keyword in title or content
  const OR = keywords.flatMap(k => [
    { title: { contains: k, mode: 'insensitive' as const } },
    { content: { contains: k, mode: 'insensitive' as const } }
  ]);

  const docs = await db.knowledgeDocument.findMany({
    where: { OR },
    take: 3
  });

  // Calculate simple relevance score in memory (occurrences of keywords)
  const scoredDocs = docs.map(doc => {
    let score = 0;
    const text = (doc.title + ' ' + doc.content).toLowerCase();
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'g');
      const matches = text.match(regex);
      if (matches) score += matches.length;
    });

    return { doc, score };
  });

  // Sort by score desc
  scoredDocs.sort((a, b) => b.score - a.score);

  return scoredDocs.map(item => ({
    id: item.doc.id,
    title: item.doc.title,
    category: item.doc.category,
    content: item.doc.content
  }));
}
