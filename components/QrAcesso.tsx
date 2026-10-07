'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, QrCode, Smartphone } from 'lucide-react';
import Sheet from './Sheet';

/** Endereço público do projeto (pode ser sobrescrito por NEXT_PUBLIC_SITE_URL). */
const URL_PROJETO = process.env.NEXT_PUBLIC_SITE_URL || 'https://eco-searce.vercel.app/';

function Qr({ url, tamanho }: { url: string; tamanho: number }) {
  return (
    <div className="inline-block rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <QRCodeSVG value={url} size={tamanho} fgColor="#1B365D" level="M" marginSize={0} className="h-auto max-w-full" />
    </div>
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
      className="inline-flex min-h-[44px] max-w-full items-center gap-1.5 rounded-md bg-slate-100 px-3 font-mono text-xs text-slate-600 hover:bg-slate-200 md:min-h-0 md:py-1"
    >
      <span className="truncate">{url}</span>
      {copiado ? <Check className="h-3.5 w-3.5 shrink-0 text-eco-600" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
    </button>
  );
}

/** Card para a página inicial. */
export function QrCard() {
  const url = URL_PROJETO;
  return (
    <section className="card flex flex-col items-center gap-5 p-4 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
      <Qr url={url} tamanho={148} />
      <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-eco-600">Avaliação do projeto</p>
        <h2 className="text-lg font-semibold text-navy-700">Acesse a EcoSearch pelo celular</h2>
        <p className="text-sm text-slate-500">
          Aponte a câmera para o QR Code para abrir o protótipo e testar o fluxo completo: anúncio, compra, MTR, escrow e painel ESG.
        </p>
        <CopiarUrl url={url} />
      </div>
    </section>
  );
}

/** Botão da barra superior que abre o QR em tela cheia (modo apresentação). */
export function QrBotao({ className }: { className?: string }) {
  const url = URL_PROJETO;
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button onClick={() => setAberto(true)} title="QR Code de acesso para a banca" aria-label="QR Code de acesso" className={className}>
        <QrCode className="h-4 w-4" />
      </button>

      {aberto && (
        <Sheet titulo="QR Code de acesso" onClose={() => setAberto(false)} largura="md:max-w-md">
          <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center sm:p-8">
            <Smartphone className="mx-auto h-8 w-8 text-eco-500" />
            <h2 className="mt-2 text-xl font-bold text-navy-700">Acesse a EcoSearch</h2>
            <p className="mt-1 text-sm text-slate-500">Aponte a câmera do celular para o código</p>
            <div className="mt-6">
              <Qr url={url} tamanho={280} />
            </div>
            <div className="mt-4">
              <CopiarUrl url={url} />
            </div>
          </div>
        </Sheet>
      )}
    </>
  );
}
