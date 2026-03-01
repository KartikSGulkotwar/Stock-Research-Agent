module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        theme: {
          card: 'var(--bg-card)',
          input: 'var(--bg-input)',
          badge: 'var(--bg-badge)',
          icon: 'var(--bg-icon)',
        },
        't-primary': 'var(--text-primary)',
        't-secondary': 'var(--text-secondary)',
        't-muted': 'var(--text-muted)',
        't-dimmed': 'var(--text-dimmed)',
        't-accent': 'var(--accent)',
        't-accent-hover': 'var(--accent-hover)',
      },
      borderColor: {
        theme: 'var(--border-color)',
        'theme-divider': 'var(--border-divider)',
      },
    },
  },
  plugins: [],
};
