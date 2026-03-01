'use client';

import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';

interface NewsArticle {
  symbol: string;
  timestamp: string;
  headline: string;
  source: string;
  url: string;
  content: string;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NewsTimeline({ symbol }: { symbol: string }) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [expanded, setExpanded] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (!symbol) return;
    fetch(`${apiUrl}/api/news/${symbol}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: NewsArticle[]) => {
        // Filter: English-only, deduplicate by headline
        const seen = new Set<string>();
        const filtered = data.filter(a => {
          if (!a.headline || a.headline === '[Removed]') return false;
          // Reject if >20% non-ASCII (Japanese, Chinese, etc.)
          const nonAscii = a.headline.replace(/[\x00-\x7F]/g, '').length;
          if (nonAscii / a.headline.length > 0.2) return false;
          // Deduplicate
          const key = a.headline.toLowerCase().trim();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setArticles(filtered);
      })
      .catch(() => {});
  }, [symbol, apiUrl]);

  if (articles.length === 0) return null;

  const shown = expanded ? articles : articles.slice(0, 5);

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <h3 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Newspaper className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        Recent News
      </h3>
      <p className="text-xs mb-4" style={{ color: 'var(--text-dimmed)' }}>
        {articles.length} articles used in sentiment analysis
      </p>

      <div className="space-y-3">
        {shown.map((article, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl p-3"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-divider)' }}
          >
            <div className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0" style={{ background: 'var(--accent)', opacity: 0.4 }} />
            <div className="flex-1 min-w-0">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium leading-tight hover:underline line-clamp-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {article.headline}
              </a>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{article.source}</span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-dimmed)' }}>
                  <Clock className="w-3 h-3" />
                  {timeAgo(article.timestamp)}
                </span>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs"
                  style={{ color: 'var(--accent)' }}
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {article.content && (
                <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--text-dimmed)' }}>
                  {article.content}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {articles.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs font-medium"
          style={{ color: 'var(--accent)' }}
        >
          {expanded ? 'Show less' : `Show all ${articles.length} articles`}
        </button>
      )}
    </div>
  );
}
