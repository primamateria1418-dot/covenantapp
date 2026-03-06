export const Colours = {
  brownDeep: '#2c1810',
  brownMid: '#5a2d1a',
  brownWarm: '#6b3322',
  gold: '#c8943a',
  goldLight: '#e8c49a',
  cream: '#fdf8f3',
  greenDeep: '#2c5f2e',
  purple: '#7c5cbf',
  darkBg: '#1a0f08',
  darkCard: '#2c1810',
} as const;

export type ColourKey = keyof typeof Colours;
