'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AlertTriangle, Check, Copy, QrCode, Smartphone, X } from 'lucide-react';

/** URL pública do projeto: NEXT_PUBLIC_SITE_URL (ex.: deploy na Vercel) ou o endereço em que a página foi aberta. */
function useUrlProjeto() {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    setUrl(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin);
  }, []);
  const local = !!url && /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url);
  return { url, local };
}

function Qr({ url, tamanho }: { url: string; tamanho: number }) {
  return (
    <div className="inline-block rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <QRCodeSVG value={url} size={tamanho} fgColor="#1B365D" level="M" marginSize={0} />
    </div>
  );
}

function AvisoLocal() {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-left text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        Este QR aponta para <strong>localhost</strong> e não abre em outros aparelhos. Rode <code>npm run dev:rede</code> e acesse
        pelo IP da rede (ex.: <code>http://192.168.0.6:3000</code>), ou publique o projeto e defina <code>NEXT_PUBLIC_SITE_URL</code>.
      </span>
    </p>
  );
}

function CopiarUrl({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(url).then(() => {
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1500);
        });
      }}
      className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600 hover:bg-slate-200"
    >
      <span className="truncate">{url}</span>
      {copiado ? <Check className="h-3.5 w-3.5 shrink-0 text-eco-600" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
    </button>
  );
}

/** Card para a página inicial. */
export function QrCard() {
  const { url, local } = useUrlProjeto();
  if (!url) return null;
  return (
    <section className="card flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start">
      <Qr url={url} tamanho={148} />
      <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-eco-600">Avaliação do projeto</p>
        <h2 className="text-lg font-semibold text-navy-700">Acesse a EcoSearch pelo celular</h2>
        <p className="text-sm text-slate-500">
          Aponte a câmera para o QR Code para abrir o protótipo e testar o fluxo completo: anúncio, compra, MTR, escrow e painel ESG.
        </p>
        <CopiarUrl url={url} />
        {local && <AvisoLocal />}
      </div>
    </section>
  );
}

/** Botão da barra superior que abre o QR em tela cheia (modo apresentação). */
export function QrBotao() {
  const { url, local } = useUrlProjeto();
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aberto]);

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        title="QR Code de acesso para a banca"
        className="rounded-md p-2 text-navy-200 transition hover:bg-white/10 hover:text-white"
      >
        <QrCode className="h-4 w-4" />
      </button>

      {aberto && url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/80 p-4 text-slate-900 backdrop-blur-sm"
          onClick={() => setAberto(false)}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setAberto(false)}
              className="absolute right-3 top-3 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
            <Smartphone className="mx-auto h-8 w-8 text-eco-500" />
            <h2 className="mt-2 text-xl font-bold text-navy-700">Acesse a EcoSearch</h2>
            <p className="mt-1 text-sm text-slate-500">Aponte a câmera do celular para o código</p>
            <div className="mt-6">
              <Qr url={url} tamanho={280} />
            </div>
            <div className="mt-4">
              <CopiarUrl url={url} />
            </div>
            {local && (
              <div className="mt-4">
                <AvisoLocal />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
