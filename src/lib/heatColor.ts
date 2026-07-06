const MIN = [0xfa, 0xee, 0xda]; // --heat-min
const MAX = [0xd8, 0x5a, 0x30]; // --heat-max

/** Interpola entre a cor mais clara (0) e mais quente (1) da escala do mapa de calor. */
export function heatColor(t: number): string {
  const c = MIN.map((v, i) => Math.round(v + (MAX[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function heatTextColor(t: number): string {
  return t > 0.55 ? '#faece7' : '#4a1b0c';
}
