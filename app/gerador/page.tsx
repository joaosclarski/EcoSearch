'use client';

import { useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, FileCheck2, Lock, Package, Upload, Wallet, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { CATEGORIAS, CATEGORIA_INFO, EMPRESA_GERADORA, type Categoria } from '@/lib/data';
import { brl, data, ton } from '@/lib/format';
import { CategoriaBadge, PageHeader, PerigosoBadge, StatTile, StatusBadge } from '@/components/ui';

const VAZIO = { nome: '', categoria: 'Químico' as Categoria, quantidade: '', preco: '', descricao: '' };

export default function GeradorPage() {
  const { lotes, pedidos, anunciarLote } = useStore();
  const [form, setForm] = useState(VAZIO);
  const [laudo, setLaudo] = useState<string | null>(null);
  const [fds, setFds] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [publicado, setPublicado] = useState<string | null>(null);

  const meus = lotes
    .filter((l) => l.gerador.cnpj === EMPRESA_GERADORA.cnpj)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  const meusPedidos = pedidos.filter((p) => p.lote.gerador.cnpj === EMPRESA_GERADORA.cnpj);
  const ativos = meus.filter((l) => l.status === 'Disponível');
  const emEscrow = meusPedidos
    .filter((p) => p.status === 'Pagamento Retido no Escrow')
    .reduce((s, p) => s + p.valores.residuos, 0);
  const recebido = meusPedidos.filter((p) => p.status === 'Concluído').reduce((s, p) => s + p.valores.residuos, 0);

  const perigoso = CATEGORIA_INFO[form.categoria].perigoso;
  const qtd = Number(form.quantidade);
  const preco = Number(form.preco);
  const set = (k: keyof typeof VAZIO) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  function enviar(e: FormEvent) {
    e.preventDefault();
    const novos: Record<string, string> = {};
    if (!form.nome.trim()) novos.nome = 'Informe o nome do material.';
    if (!(qtd > 0)) novos.quantidade = 'Quantidade deve ser maior que zero.';
    if (!(preco > 0)) novos.preco = 'Preço deve ser maior que zero.';
    if (!laudo) novos.laudo = 'Anexe o laudo de caracterização.';
    if (perigoso && !fds) novos.fds = 'FDS/FISPQ é obrigatória para resíduos químicos.';
    setErros(novos);
    if (Object.keys(novos).length) return;

    anunciarLote({
      nome: form.nome.trim(),
      categoria: form.categoria,
      quantidade: qtd,
      precoUnidade: preco,
      descricao: form.descricao.trim(),
      laudo,
      fds,
    });
    setPublicado(form.nome.trim());
    setForm(VAZIO);
    setLaudo(null);
    setFds(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Visão Gerador"
        title="Anunciar Resíduo"
        description={
          <>
            Publique lotes de resíduos industriais para compradores qualificados. Logado como{' '}
            <strong className="text-navy-700">{EMPRESA_GERADORA.nome}</strong>.
          </>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatTile icon={Package} label="Lotes ativos no catálogo" value={String(ativos.length)} hint={`${ton(ativos.reduce((s, l) => s + l.quantidade, 0))} anunciadas`} />
        <StatTile icon={Lock} label="Valores retidos em escrow" value={brl(emEscrow)} hint="Liberados após pesagem no destino" />
        <StatTile icon={Wallet} label="Receita liberada" value={brl(recebido)} tone="eco" hint="Vendas concluídas" />
      </div>

      <form onSubmit={enviar} className="card p-6" noValidate>
        <h2 className="text-base font-semibold text-navy-700">Dados do lote</h2>

        {publicado && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-eco-200 bg-eco-50 p-3 text-sm text-eco-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1">
              <strong>{publicado}</strong> foi publicado no catálogo e já está visível para compradores.
            </p>
            <button type="button" onClick={() => setPublicado(null)} aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mt-5 grid gap-5 md:grid-cols-6">
          <div className="md:col-span-4">
            <label className="label" htmlFor="nome">Nome do material</label>
            <input id="nome" className="input" placeholder="Ex.: Solvente orgânico usado (acetona/xileno)" value={form.nome} onChange={set('nome')} />
            <Erro msg={erros.nome} />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="categoria">Categoria</label>
            <select id="categoria" className="input" value={form.categoria} onChange={set('categoria')}>
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="qtd">Quantidade (toneladas)</label>
            <input id="qtd" type="number" min="0" step="0.1" className="input" placeholder="10" value={form.quantidade} onChange={set('quantidade')} />
            <Erro msg={erros.quantidade} />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="preco">Preço por tonelada (R$)</label>
            <input id="preco" type="number" min="0" step="0.01" className="input" placeholder="1500,00" value={form.preco} onChange={set('preco')} />
            <Erro msg={erros.preco} />
          </div>
          <div className="md:col-span-2">
            <span className="label">Valor total do lote</span>
            <div className="flex h-[38px] items-center rounded-lg bg-slate-50 px-3 text-sm font-semibold tabular-nums text-navy-700 ring-1 ring-inset ring-slate-200">
              {qtd > 0 && preco > 0 ? brl(qtd * preco) : '—'}
            </div>
          </div>
          <div className="md:col-span-6">
            <label className="label" htmlFor="desc">Descrição técnica <span className="font-normal text-slate-400">(opcional)</span></label>
            <textarea id="desc" rows={2} className="input" placeholder="Origem, composição, acondicionamento, frequência de geração…" value={form.descricao} onChange={set('descricao')} />
          </div>
          <div className="md:col-span-3">
            <UploadField label="Laudo de caracterização" hint="NBR 10004 · PDF" arquivo={laudo} onChange={setLaudo} />
            <Erro msg={erros.laudo} />
          </div>
          <div className="md:col-span-3">
            <UploadField
              label={`FDS / FISPQ${perigoso ? '' : ' (opcional)'}`}
              hint={perigoso ? 'Obrigatória para Classe I · PDF' : 'Ficha de segurança · PDF'}
              arquivo={fds}
              onChange={setFds}
            />
            <Erro msg={erros.fds} />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {perigoso && <PerigosoBadge />}
            <span>{CATEGORIA_INFO[form.categoria].classe} · Código IBAMA {CATEGORIA_INFO[form.categoria].codigoIbama}</span>
          </div>
          <button type="submit" className="btn-eco">
            <Upload className="h-4 w-4" /> Publicar lote
          </button>
        </div>
      </form>

      <section id="meus-lotes" className="mt-10 scroll-mt-24">
        <h2 className="text-lg font-semibold text-navy-700">Meus Lotes Anunciados</h2>
        <div className="card mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Lote</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-right">Quantidade</th>
                <th className="px-4 py-3 text-right">Preço/t</th>
                <th className="px-4 py-3 text-right">Valor total</th>
                <th className="px-4 py-3">Documentos</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {meus.map((l) => {
                const pedido = pedidos.find((p) => p.loteId === l.id);
                return (
                  <tr key={l.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy-700">{l.nome}</p>
                      <p className="text-xs text-slate-400">{l.id} · {data(l.criadoEm)}</p>
                    </td>
                    <td className="px-4 py-3"><CategoriaBadge categoria={l.categoria} /></td>
                    <td className="px-4 py-3 text-right tabular-nums">{ton(l.quantidade)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{brl(l.precoUnidade)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-navy-700">{brl(l.quantidade * l.precoUnidade)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {l.laudo && <DocChip nome="Laudo" />}
                        {l.fds && <DocChip nome="FDS" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={l.status} />
                      {pedido && pedido.status !== 'Concluído' && (
                        <p className="mt-1 text-xs text-slate-500">{pedido.status}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Erro({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-xs text-red-600">{msg}</p> : null;
}

function DocChip({ nome }: { nome: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-eco-50 px-1.5 py-0.5 text-xs font-medium text-eco-700">
      <FileCheck2 className="h-3 w-3" /> {nome}
    </span>
  );
}

function UploadField({
  label,
  hint,
  arquivo,
  onChange,
}: {
  label: string;
  hint: string;
  arquivo: string | null;
  onChange: (nome: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className="label">{label}</span>
      {arquivo ? (
        <div className="flex items-center gap-3 rounded-lg border border-eco-200 bg-eco-50 px-3 py-2.5 text-sm">
          <FileCheck2 className="h-5 w-5 shrink-0 text-eco-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-eco-800">{arquivo}</p>
            <p className="text-xs text-eco-600">Upload simulado · validado</p>
          </div>
          <button type="button" onClick={() => onChange(null)} className="text-eco-700 hover:text-eco-900" aria-label="Remover arquivo">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex w-full items-center gap-3 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-left text-sm transition hover:border-eco-400 hover:bg-eco-50/40"
        >
          <Upload className="h-5 w-5 shrink-0 text-slate-400" />
          <span>
            <span className="font-medium text-navy-700">Selecionar arquivo</span>
            <span className="block text-xs text-slate-400">{hint}</span>
          </span>
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept=".pdf,.png,.jpg"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f.name);
          e.target.value = '';
        }}
      />
    </div>
  );
}
