### Tailwind patch

**tailwind.config.ts**
```ts
theme: {
  extend: {
    colors: {
      bg: 'rgb(var(--color-bg) / <alpha-value>)',
      card: 'rgb(var(--color-card) / <alpha-value>)',
      foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
      muted: 'rgb(var(--color-muted) / <alpha-value>)',
      primary: 'rgb(var(--color-primary) / <alpha-value>)',
    },
    borderRadius: {
      DEFAULT: 'var(--radius)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
    },
    boxShadow: {
      sm: 'var(--shadow-sm)',
      DEFAULT: 'var(--shadow)',
      lg: 'var(--shadow-lg)',
    },
    keyframes: {
      shimmer: {
        '100%': { transform: 'translateX(100%)' },
      },
    },
    animation: {
      shimmer: 'shimmer 1.6s infinite',
    },
  }
}
```
