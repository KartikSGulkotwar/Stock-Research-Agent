'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Monitor, Moon, Sun } from 'lucide-react';

const themes = [
  { key: 'default' as const, label: 'Default', icon: Monitor },
  { key: 'dark' as const, label: 'Dark', icon: Moon },
  { key: 'light' as const, label: 'Light', icon: Sun },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
      {themes.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          title={label}
          className="p-2 rounded-lg transition-all duration-200"
          style={{
            background: theme === key ? 'var(--accent)' : 'transparent',
            color: theme === key ? '#ffffff' : 'var(--text-muted)',
          }}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
