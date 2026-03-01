'use client';

import { useState, useEffect } from 'react';
import { Building2, Globe, Users, Briefcase, ExternalLink } from 'lucide-react';

interface Profile {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  exchange: string;
  description: string;
  ceo: string;
  country: string;
  employees: number;
  website: string;
  image: string;
}

interface Peer {
  symbol: string;
  companyName: string;
  price: number;
  marketCap: number;
  beta: number;
  changes: number;
  changesPercentage: number;
}

export default function CompanyProfile({ symbol }: { symbol: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (!symbol) return;
    fetch(`${apiUrl}/api/profile/${symbol}`).then(r => r.ok ? r.json() : null).then(setProfile).catch(() => {});
    fetch(`${apiUrl}/api/peers/${symbol}`).then(r => r.ok ? r.json() : null).then(d => setPeers(d || [])).catch(() => {});
  }, [symbol, apiUrl]);

  if (!profile) return null;

  return (
    <div className="space-y-4">
      {/* Company Info */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start gap-4 mb-4">
          {profile.image && (
            <img
              src={profile.image}
              alt={profile.companyName}
              className="w-12 h-12 rounded-xl object-contain"
              style={{ background: 'var(--bg-input)', padding: '4px' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{profile.companyName}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                {profile.sector}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-badge)', color: 'var(--text-muted)' }}>
                {profile.industry}
              </span>
              {profile.exchange && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-badge)', color: 'var(--text-dimmed)' }}>
                  {profile.exchange}
                </span>
              )}
            </div>
          </div>
        </div>

        {profile.description && (
          <p className="text-xs leading-relaxed mb-3 line-clamp-3" style={{ color: 'var(--text-muted)' }}>
            {profile.description.slice(0, 300)}{profile.description.length > 300 ? '...' : ''}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {profile.ceo && (
            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Briefcase className="w-3 h-3" style={{ color: 'var(--text-dimmed)' }} />
              <span>CEO: {profile.ceo}</span>
            </div>
          )}
          {profile.country && (
            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Globe className="w-3 h-3" style={{ color: 'var(--text-dimmed)' }} />
              <span>{profile.country}</span>
            </div>
          )}
          {profile.employees > 0 && (
            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Users className="w-3 h-3" style={{ color: 'var(--text-dimmed)' }} />
              <span>{(profile.employees / 1000).toFixed(0)}K employees</span>
            </div>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5"
              style={{ color: 'var(--accent)' }}
            >
              <ExternalLink className="w-3 h-3" />
              <span>Website</span>
            </a>
          )}
        </div>
      </div>

      {/* Sector Peers */}
      {peers.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Building2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            Sector Peers
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {peers.map(peer => (
              <div key={peer.symbol} className="rounded-xl p-3" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-divider)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{peer.symbol}</span>
                  <span className={`text-xs font-medium ${peer.changesPercentage > 0 ? 'text-emerald-400' : peer.changesPercentage < 0 ? 'text-red-400' : ''}`}>
                    {peer.changesPercentage > 0 ? '+' : ''}{peer.changesPercentage?.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{peer.companyName}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  ${peer.price.toFixed(2)} &middot; {peer.marketCap > 1e12 ? `$${(peer.marketCap / 1e12).toFixed(1)}T` : `$${(peer.marketCap / 1e9).toFixed(0)}B`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
