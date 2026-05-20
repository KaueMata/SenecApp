/**
 * useCalendario.ts
 * Store Zustand para gestão do orçamento de tempo diário.
 * Lógica de Neurociência: Ritmos Circadianos, Carga Cognitiva e Efeito Cascata.
 */

import { create } from 'zustand';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export type CargaCognitiva = 'baixa' | 'media' | 'alta';
export type TipoBloco = 'hard' | 'soft' | 'sono' | 'recuperacao';

export type JanelaCircadiana =
  | 'pico_cognitivo'     // 08:00–12:00 → Foco/Analítico
  | 'post_lunch_dip'     // 13:00–16:00 → Baixa energia
  | 'segundo_pico'       // 16:00–20:00 → Criativo
  | 'declinio'           // 20:00–00:00 → Descanso
  | 'sono';              // 00:00–08:00 (padrão)

export interface BlocoTempo {
  id: string;
  titulo: string;
  tipo: TipoBloco;
  inicioMinutos: number;    // Minutos desde 00:00
  duracaoMinutos: number;
  cargaCognitiva: CargaCognitiva;
  cor?: string;
  icone?: string;
  concluido?: boolean;
  atrasadoMinutos?: number; // Quantos minutos de atraso
}

export interface AlertaCascata {
  tipo: 'colisao_hard_block' | 'saldo_negativo' | 'ultradiano';
  mensagem: string;
  blocoId?: string;
}

export interface AvaliacaoCognitiva {
  janela: JanelaCircadiana;
  compatibilidade: 'otima' | 'boa' | 'neutra' | 'ruim';
  descricao: string;
  pontuacao: number; // 0–100
}

// ─────────────────────────────────────────────
// FUNÇÕES PURAS DE NEGÓCIO
// ─────────────────────────────────────────────

/** Converte "HH:MM" para minutos desde 00:00 */
export function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** Converte minutos desde 00:00 para "HH:MM" */
export function minutosParaHora(minutos: number): string {
  const total = ((minutos % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60).toString().padStart(2, '0');
  const m = (total % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** Retorna a janela circadiana para um dado minuto do dia */
export function getJanelaCircadiana(inicioMinutos: number): JanelaCircadiana {
  const hora = inicioMinutos / 60;
  if (hora >= 8 && hora < 13) return 'pico_cognitivo';
  if (hora >= 13 && hora < 16) return 'post_lunch_dip';
  if (hora >= 16 && hora < 20) return 'segundo_pico';
  if (hora >= 20 || hora < 6) return 'declinio';
  return 'sono';
}

/** Avalia compatibilidade cognitiva de um bloco com seu horário */
export function avaliarCognicao(bloco: BlocoTempo): AvaliacaoCognitiva {
  const janela = getJanelaCircadiana(bloco.inicioMinutos);
  const { cargaCognitiva } = bloco;

  type Mapa = Record<JanelaCircadiana, Record<CargaCognitiva, Omit<AvaliacaoCognitiva, 'janela'>>>;

  const mapa: Mapa = {
    pico_cognitivo: {
      alta:  { compatibilidade: 'otima',  pontuacao: 95, descricao: 'Janela ideal para foco profundo' },
      media: { compatibilidade: 'boa',    pontuacao: 75, descricao: 'Bom aproveitamento cognitivo' },
      baixa: { compatibilidade: 'neutra', pontuacao: 50, descricao: 'Subutilização do pico de foco' },
    },
    post_lunch_dip: {
      alta:  { compatibilidade: 'ruim',   pontuacao: 25, descricao: 'Evite tarefas complexas após o almoço' },
      media: { compatibilidade: 'neutra', pontuacao: 45, descricao: 'Energia em queda, prefira rotinas' },
      baixa: { compatibilidade: 'boa',    pontuacao: 70, descricao: 'Ideal para tarefas administrativas' },
    },
    segundo_pico: {
      alta:  { compatibilidade: 'boa',    pontuacao: 80, descricao: 'Ótimo para tarefas criativas' },
      media: { compatibilidade: 'otima',  pontuacao: 90, descricao: 'Pico criativo — aproveite!' },
      baixa: { compatibilidade: 'neutra', pontuacao: 55, descricao: 'Subutilização do segundo pico' },
    },
    declinio: {
      alta:  { compatibilidade: 'ruim',   pontuacao: 20, descricao: 'Cognição em declínio — não recomendado' },
      media: { compatibilidade: 'ruim',   pontuacao: 35, descricao: 'Preferível encerrar tarefas exigentes' },
      baixa: { compatibilidade: 'boa',    pontuacao: 65, descricao: 'Ideal para relaxar e revisar' },
    },
    sono: {
      alta:  { compatibilidade: 'ruim',   pontuacao: 10, descricao: 'Horário de sono — impacto severo' },
      media: { compatibilidade: 'ruim',   pontuacao: 15, descricao: 'Horário de sono — não recomendado' },
      baixa: { compatibilidade: 'ruim',   pontuacao: 20, descricao: 'Horário reservado para recuperação' },
    },
  };

  return { janela, ...mapa[janela][cargaCognitiva] };
}

/** Detecta colisões entre dois blocos */
export function detectarColisao(a: BlocoTempo, b: BlocoTempo): boolean {
  const fimA = a.inicioMinutos + a.duracaoMinutos;
  const fimB = b.inicioMinutos + b.duracaoMinutos;
  return a.inicioMinutos < fimB && fimA > b.inicioMinutos;
}

/**
 * Efeito Cascata: aplica atraso aos Soft Blocks subsequentes.
 * Retorna nova lista de blocos + alertas gerados.
 */
export function aplicarEfeitoCascata(
  blocos: BlocoTempo[],
  blocoAtrasadoId: string,
  atrasadoMinutos: number
): { blocos: BlocoTempo[]; alertas: AlertaCascata[] } {
  const sorted = [...blocos].sort((a, b) => a.inicioMinutos - b.inicioMinutos);
  const idxAtrasado = sorted.findIndex((b) => b.id === blocoAtrasadoId);

  if (idxAtrasado === -1 || atrasadoMinutos <= 0) {
    return { blocos: sorted, alertas: [] };
  }

  const alertas: AlertaCascata[] = [];
  const resultado = sorted.map((bloco, idx) => {
    if (idx <= idxAtrasado) return bloco;
    if (bloco.tipo === 'hard') {
      // Verifica se o hard block vai colidir após o cascateamento
      const blocoAnterior = resultado[idx - 1] ?? sorted[idx - 1];
      const fimAnterior = blocoAnterior.inicioMinutos + blocoAnterior.duracaoMinutos;
      if (fimAnterior > bloco.inicioMinutos) {
        alertas.push({
          tipo: 'colisao_hard_block',
          mensagem: `"${bloco.titulo}" (Hard Block) colide com o atraso em cascata!`,
          blocoId: bloco.id,
        });
      }
      return bloco; // Hard blocks não se movem
    }
    // Soft block: empurra para frente
    return { ...bloco, inicioMinutos: bloco.inicioMinutos + atrasadoMinutos };
  });

  // Verifica se algum bloco passou de 24h (1440 min)
  const saldoFinal = calcularSaldoLivre(resultado);
  if (saldoFinal < 0) {
    alertas.push({
      tipo: 'saldo_negativo',
      mensagem: `O dia ultrapassou 24h! Remova ${Math.abs(saldoFinal)} min de tarefas.`,
    });
  }

  return { blocos: resultado, alertas };
}

/** Verifica se uma tarefa excede 90min (ritmo ultradiano) e sugere pausa */
export function verificarUltradiano(bloco: BlocoTempo): AlertaCascata | null {
  if (bloco.cargaCognitiva === 'alta' && bloco.duracaoMinutos > 90) {
    return {
      tipo: 'ultradiano',
      mensagem: `"${bloco.titulo}" tem ${bloco.duracaoMinutos}min de foco intenso. Considere uma pausa de 15–20min após 90min.`,
      blocoId: bloco.id,
    };
  }
  return null;
}

/** Calcula o saldo livre de minutos no dia (excluindo sono e blocos agendados) */
export function calcularSaldoLivre(blocos: BlocoTempo[]): number {
  const totalUsado = blocos.reduce((acc, b) => acc + b.duracaoMinutos, 0);
  return 1440 - totalUsado;
}

/** Gera uma cor padrão por tipo de bloco */
export function corPorTipo(tipo: TipoBloco): string {
  const cores: Record<TipoBloco, string> = {
    hard:        '#FF6B6B',
    soft:        '#4ECDC4',
    sono:        '#6C5CE7',
    recuperacao: '#A8E6CF',
  };
  return cores[tipo];
}

// ─────────────────────────────────────────────
// ESTADO INICIAL DE EXEMPLO
// ─────────────────────────────────────────────

const blocosIniciais: BlocoTempo[] = [
  {
    id: 'sono',
    titulo: 'Sono',
    tipo: 'sono',
    inicioMinutos: horaParaMinutos('23:00'),
    duracaoMinutos: 480, // 8h
    cargaCognitiva: 'baixa',
    cor: '#6C5CE7',
    icone: '🌙',
  },
  {
    id: 'manha',
    titulo: 'Rotina Matinal',
    tipo: 'soft',
    inicioMinutos: horaParaMinutos('07:00'),
    duracaoMinutos: 60,
    cargaCognitiva: 'baixa',
    cor: '#FFD93D',
    icone: '☀️',
  },
  {
    id: 'trabalho',
    titulo: 'Trabalho',
    tipo: 'hard',
    inicioMinutos: horaParaMinutos('08:00'),
    duracaoMinutos: 240, // 4h
    cargaCognitiva: 'alta',
    cor: '#FF6B6B',
    icone: '💼',
  },
  {
    id: 'almoco',
    titulo: 'Almoço',
    tipo: 'soft',
    inicioMinutos: horaParaMinutos('12:00'),
    duracaoMinutos: 60,
    cargaCognitiva: 'baixa',
    cor: '#F7B731',
    icone: '🍽️',
  },
  {
    id: 'pausa_ultradiana',
    titulo: 'Recuperação',
    tipo: 'recuperacao',
    inicioMinutos: horaParaMinutos('13:00'),
    duracaoMinutos: 20,
    cargaCognitiva: 'baixa',
    cor: '#A8E6CF',
    icone: '🧘',
  },
  {
    id: 'estudos',
    titulo: 'Estudos / Criativo',
    tipo: 'soft',
    inicioMinutos: horaParaMinutos('16:00'),
    duracaoMinutos: 120,
    cargaCognitiva: 'media',
    cor: '#4ECDC4',
    icone: '📚',
  },
  {
    id: 'exercicio',
    titulo: 'Exercício',
    tipo: 'soft',
    inicioMinutos: horaParaMinutos('18:30'),
    duracaoMinutos: 60,
    cargaCognitiva: 'baixa',
    cor: '#45B7D1',
    icone: '🏋️',
  },
];

// ─────────────────────────────────────────────
// STORE ZUSTAND
// ─────────────────────────────────────────────

interface CalendarioState {
  blocos: BlocoTempo[];
  alertas: AlertaCascata[];
  horaAtual: number; // Minutos desde 00:00 (atualizado em tempo real)

  // Actions
  adicionarBloco: (bloco: Omit<BlocoTempo, 'id'>) => void;
  removerBloco: (id: string) => void;
  atualizarBloco: (id: string, alteracoes: Partial<BlocoTempo>) => void;
  marcarConcluido: (id: string) => void;
  aplicarAtraso: (id: string, minutos: number) => void;
  dispensarAlerta: (index: number) => void;
  limparAlertas: () => void;
  setHoraAtual: (minutos: number) => void;

  // Selectors (calculados)
  getSaldoLivre: () => number;
  getBlocosOrdenados: () => BlocoTempo[];
  getAvaliacaoCognitiva: (id: string) => AvaliacaoCognitiva | null;
  getBlocoEmAndamento: () => BlocoTempo | null;
}

export const useCalendario = create<CalendarioState>((set, get) => ({
  blocos: blocosIniciais,
  alertas: [],
  horaAtual: (() => {
    const agora = new Date();
    return agora.getHours() * 60 + agora.getMinutes();
  })(),

  // ── Actions ──────────────────────────────────

  adicionarBloco: (bloco) => {
    const id = `bloco_${Date.now()}`;
    const novo: BlocoTempo = { ...bloco, id, cor: bloco.cor ?? corPorTipo(bloco.tipo) };

    // Verifica ritmo ultradiano
    const alertaUltradiano = verificarUltradiano(novo);
    const novosAlertas = alertaUltradiano ? [alertaUltradiano] : [];

    set((state) => ({
      blocos: [...state.blocos, novo],
      alertas: [...state.alertas, ...novosAlertas],
    }));
  },

  removerBloco: (id) =>
    set((state) => ({
      blocos: state.blocos.filter((b) => b.id !== id),
    })),

  atualizarBloco: (id, alteracoes) =>
    set((state) => ({
      blocos: state.blocos.map((b) => (b.id === id ? { ...b, ...alteracoes } : b)),
    })),

  marcarConcluido: (id) =>
    set((state) => ({
      blocos: state.blocos.map((b) =>
        b.id === id ? { ...b, concluido: !b.concluido } : b
      ),
    })),

  aplicarAtraso: (id, minutos) => {
    const { blocos } = get();
    const { blocos: novosBlocos, alertas: novosAlertas } = aplicarEfeitoCascata(
      blocos,
      id,
      minutos
    );
    set((state) => ({
      blocos: novosBlocos.map((b) =>
        b.id === id ? { ...b, atrasadoMinutos: (b.atrasadoMinutos ?? 0) + minutos } : b
      ),
      alertas: [...state.alertas, ...novosAlertas],
    }));
  },

  dispensarAlerta: (index) =>
    set((state) => ({
      alertas: state.alertas.filter((_, i) => i !== index),
    })),

  limparAlertas: () => set({ alertas: [] }),

  setHoraAtual: (minutos) => set({ horaAtual: minutos }),

  // ── Selectors ────────────────────────────────

  getSaldoLivre: () => calcularSaldoLivre(get().blocos),

  getBlocosOrdenados: () =>
    [...get().blocos].sort((a, b) => a.inicioMinutos - b.inicioMinutos),

  getAvaliacaoCognitiva: (id) => {
    const bloco = get().blocos.find((b) => b.id === id);
    return bloco ? avaliarCognitiva(bloco) : null;
  },

  getBlocoEmAndamento: () => {
    const { horaAtual, blocos } = get();
    return (
      blocos.find(
        (b) =>
          b.inicioMinutos <= horaAtual &&
          horaAtual < b.inicioMinutos + b.duracaoMinutos
      ) ?? null
    );
  },
}));

// Alias para compatibilidade (avaliarCognicao → avaliarCognitiva)
const avaliarCognitiva = avaliarCognicao;