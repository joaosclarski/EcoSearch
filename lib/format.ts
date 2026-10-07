const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const numFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

const brlCompactoFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 });

export const brl = (n: number) => brlFmt.format(n);
export const brlCompacto = (n: number) => brlCompactoFmt.format(n);
export const num = (n: number) => numFmt.format(n);
export const ton = (n: number) => `${numFmt.format(n)} t`;

export function dataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function data(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}
