/**
 * @file mockData.ts
 * @description Dados de exemplo para desenvolvimento e testes.
 * Simula um dia completo com Hard/Soft Blocks, variações de carga
 * cognitiva e um cenário pronto para testar o Efeito Cascata.
 *
 * Localização: /constants/mockData.ts
 *
 * CENÁRIO DO DIA:
 * O usuário dorme 8h (480 min), restando 16h (960 min) livres.
 * Tem uma reunião fixa (Hard) às 10h e trabalho fixo às 14h.
 * O resto são Soft Blocks que flutuam em caso de atraso.
 *
 * TESTE DE CASCATA SUGERIDO:
 * Atrasar a tarefa "tarefa_002" (Exercício) em 30 minutos e
 * observar o deslocamento em cascata nos Soft Blocks seguintes.
 */

import type { Tarefa, EntradaCalendario, Calendario } from '@/constants/types';

// ─────────────────────────────────────────────
// DATA DE REFERÊNCIA
// ─────────────────────────────────────────────

export const DATA_MOCK = '2025-07-14';
const AGORA = new Date().toISOString();

// ─────────────────────────────────────────────
// TAREFAS DO DIA
// ─────────────────────────────────────────────

/**
 * Lista de tarefas ordenadas cronologicamente.
 * Cobre um dia completo das 06:00 às 22:00.
 */
export const TAREFAS_MOCK: Tarefa[] = [
  // ── 06:00 | Soft | Manhã leve ──────────────
  {
    id: 'tarefa_001',
    titulo: 'Manhã: Higiene e Café',
    descricao: 'Acordar, higiene pessoal, café da manhã tranquilo.',
    horarioInicio: '06:00',
    horarioFim: '06:45',
    duracaoMinutos: 45,
    tipoBloco: 'soft',
    status: 'pendente',
    atrasosMinutos: 0,
    neurociencia: {
      cargaCognitiva: 'baixa',
      janelaCircadiana: 'fora_de_janela',
      scoreAlinhamento: 60,
      alertaUltradiano: false,
    },
    categoria: 'rotina',
    corHex: '#A8D8EA',
    icone: 'coffee',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
  },

  // ── 06:45 | Soft | Exercício ────────────────
  {
    id: 'tarefa_002',
    titulo: 'Exercício Físico',
    descricao: 'Corrida leve ou academia. Ativa o corpo antes do pico cognitivo.',
    horarioInicio: '06:45',
    horarioFim: '07:45',
    duracaoMinutos: 60,
    tipoBloco: 'soft',
    status: 'pendente',
    atrasosMinutos: 0,
    neurociencia: {
      cargaCognitiva: 'media',
      janelaCircadiana: 'fora_de_janela',
      scoreAlinhamento: 40,
      alertaUltradiano: false,
    },
    categoria: 'saúde',
    corHex: '#B8F0B8',
    icone: 'activity',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
  },

  // ── 08:00 | Soft | Foco profundo ───────────
  // ⚠️ alerta ultradiano: 120 min de alta carga
  {
    id: 'tarefa_003',
    titulo: 'Foco Profundo: Projeto Principal',
    descricao: 'Bloco de trabalho analítico no pico cognitivo da manhã.',
    horarioInicio: '08:00',
    horarioFim: '10:00',
    duracaoMinutos: 120,
    tipoBloco: 'soft',
    status: 'pendente',
    atrasosMinutos: 0,
    neurociencia: {
      cargaCognitiva: 'alta',
      janelaCircadiana: 'pico_analitico',
      scoreAlinhamento: 100,
      alertaUltradiano: true,      // 120 min > 90 min limite ultradiano
      duracaoPausaSugerida: 20,
    },
    categoria: 'trabalho',
    corHex: '#FFD93D',
    icone: 'zap',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
  },

  // ── 10:00 | HARD | Reunião fixa ────────────
  // 🔒 Não pode ser deslocada pelo cascata
  {
    id: 'tarefa_004',
    titulo: 'Reunião de Equipe',
    descricao: 'Daily/sync semanal. Horário fixo definido pelo time.',
    horarioInicio: '10:00',
    horarioFim: '11:00',
    duracaoMinutos: 60,
    tipoBloco: 'hard',
    status: 'pendente',
    atrasosMinutos: 0,
    neurociencia: {
      cargaCognitiva: 'media',
      janelaCircadiana: 'pico_analitico',
      scoreAlinhamento: 85,
      alertaUltradiano: false,
    },
    categoria: 'trabalho',
    corHex: '#FF6B6B',
    icone: 'users',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
  },

  // ── 11:00 | Soft | Revisão leve ────────────
  {
    id: 'tarefa_005',
    titulo: 'Revisão de E-mails e Mensagens',
    descricao: 'Processar comunicações, responder o essencial.',
    horarioInicio: '11:00',
    horarioFim: '11:30',
    duracaoMinutos: 30,
    tipoBloco: 'soft',
    status: 'pendente',
    atrasosMinutos: 0,
    neurociencia: {
      cargaCognitiva: 'baixa',
      janelaCircadiana: 'pico_analitico',
      scoreAlinhamento: 70,
      alertaUltradiano: false,
    },
    categoria: 'trabalho',
    corHex: '#C3B1E1',
    icone: 'mail',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
  },

  // ── 12:00 | Soft | Almoço ──────────────────
  {
    id: 'tarefa_006',
    titulo: 'Almoço',
    descricao: 'Refeição sem telas. Recuperação antes do dip pós-almoço.',
    horarioInicio: '12:00',
    horarioFim: '13:00',
    duracaoMinutos: 60,
    tipoBloco: 'soft',
    status: 'pendente',
    atrasosMinutos: 0,
    neurociencia: {
      cargaCognitiva: 'baixa',
      janelaCircadiana: 'dip_pos_almoco',
      scoreAlinhamento: 80,
      alertaUltradiano: false,
    },
    categoria: 'rotina',
    corHex: '#FFDAC1',
    icone: 'utensils',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
  },

  // ── 13:00 | Soft | Tarefas administrativas ─
  // ✅ Ideal para o dip pós-almoço (baixa carga)
  {
    id: 'tarefa_007',
    titulo: 'Tarefas Administrativas',
    descricao: 'Pagar contas, organizar documentos, tarefas mecânicas.',
    horarioInicio: '13:00',
    horarioFim: '14:00',
    duracaoMinutos: 60,
    tipoBloco: 'soft',
    status: 'pendente',
    atrasosMinutos: 0,
    neurociencia: {
      cargaCognitiva: 'baixa',
      janelaCircadiana: 'dip_pos_almoco',
      scoreAlinhamento: 80,
      alertaUltradiano: false,
    },
    categoria: 'rotina',
    corHex: '#B5EAD7',
    icone: 'file-text',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
  },

  // ── 14:00 | HARD | Trabalho fixo ───────────
  // 🔒 Compromisso externo com hora marcada
  {
    id: 'tarefa_008',
    titulo: 'Trabalho: Bloco da Tarde',
    descricao: 'Compromisso fixo de trabalho com horário externo.',
    horarioInicio: '14:00',
    horarioFim: '16:00',
    duracaoMinutos: 120,
    tipoBloco: 'hard',
    status: 'pendente',
    atrasosMinutos: 0,
    neurociencia: {
      cargaCognitiva: 'alta',
      janelaCircadiana: 'dip_pos_almoco',
      scoreAlinhamento: 30, // alta carga no dip = alinhamento ruim, mas é fixo
      alertaUltradiano: true,
      duracaoPausaSugerida: 30,
    },
    categoria: 'trabalho',
    corHex: '#FF6B6B',
    icone: 'briefcase',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
  },

  // ── 16:00 | Soft | Criativo ─────────────────
  // ✅ Segundo pico: ideal para brainstorm e criatividade
  {
    id: 'tarefa_009',
    titulo: 'Projeto Criativo / Side Project',
    descricao: 'Brainstorm, design, escrita criativa. Aproveita o segundo pico.',
    horarioInicio: '16:00',
    horarioFim: '17:30',
    duracaoMinutos: 90,
    tipoBloco: 'soft',
    status: 'pendente',
    atrasosMinutos: 0,
    neurociencia: {
      cargaCognitiva: 'alta',
      janelaCircadiana: 'pico_criativo',
      scoreAlinhamento: 80,
      alertaUltradiano: false, // exatamente 90 min, não ultrapassa
    },
    categoria: 'desenvolvimento',
    corHex: '#FFD93D',
    icone: 'pen-tool',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
  },

  // ── 17:30 | Soft | Pausa ───────────────────
  {
    id: 'tarefa_010',
    titulo: 'Pausa Ultradiana / Lanche',
    descricao: 'Recuperação ativa. Caminhada, stretching ou lanche leve.',
    horarioInicio: '17:30',
    horarioFim: '18:00',
    duracaoMinutos: 30,
    tipoBloco: 'soft',
    status: 'pendente',
    atrasosMinutos: 0,
    neurociencia: {
      cargaCognitiva: 'baixa',
      janelaCircadiana: 'pico_criativo',
      scoreAlinhamento: 70,
      alertaUltradiano: false,
    },
    categoria: 'saúde',
    corHex: '#B8F0B8',
    icone: 'heart',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
  },

  // ── 18:00 | Soft | Estudo/Leitura ──────────
  {
    id: 'tarefa_011',
    titulo: 'Estudo / Leitura',
    descricao: 'Aprendizado ativo enquanto o segundo pico ainda persiste.',
    horarioInicio: '18:00',
    horarioFim: '19:00',
    duracaoMinutos: 60,
    tipoBloco: 'soft',
    status: 'pendente',
    atrasosMinutos: 0,
    neurociencia: {
      cargaCognitiva: 'media',
      janelaCircadiana: 'pico_criativo',
      scoreAlinhamento: 75,
      alertaUltradiano: false,
    },
    categoria: 'desenvolvimento',
    corHex: '#C3B1E1',
    icone: 'book-open',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
  },

  // ── 19:00 | Soft | Jantar ──────────────────
  {
    id: 'tarefa_012',
    titulo: 'Jantar',
    descricao: 'Refeição leve. Início do declínio cognitivo.',
    horarioInicio: '19:00',
    horarioFim: '19:45',
    duracaoMinutos: 45,
    tipoBloco: 'soft',
    status: 'pendente',
    atrasosMinutos: 0,
    neurociencia: {
      cargaCognitiva: 'baixa',
      janelaCircadiana: 'pico_criativo',
      scoreAlinhamento: 70,
      alertaUltradiano: false,
    },
    categoria: 'rotina',
    corHex: '#FFDAC1',
    icone: 'utensils',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
  },

  // ── 20:00 | Soft | Lazer ───────────────────
  {
    id: 'tarefa_013',
    titulo: 'Lazer / Família / Descanso',
    descricao: 'Tempo livre sem obrigações. Tela azul reduzida.',
    horarioInicio: '20:00',
    horarioFim: '21:30',
    duracaoMinutos: 90,
    tipoBloco: 'soft',
    status: 'pendente',
    atrasosMinutos: 0,
    neurociencia: {
      cargaCognitiva: 'baixa',
      janelaCircadiana: 'declinio',
      scoreAlinhamento: 65,
      alertaUltradiano: false,
    },
    categoria: 'lazer',
    corHex: '#A8D8EA',
    icone: 'sunset',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
  },

  // ── 21:30 | Soft | Rotina noturna ──────────
  {
    id: 'tarefa_014',
    titulo: 'Rotina Noturna',
    descricao: 'Higiene, journaling, preparar ambiente para sono.',
    horarioInicio: '21:30',
    horarioFim: '22:00',
    duracaoMinutos: 30,
    tipoBloco: 'soft',
    status: 'pendente',
    atrasosMinutos: 0,
    neurociencia: {
      cargaCognitiva: 'baixa',
      janelaCircadiana: 'declinio',
      scoreAlinhamento: 65,
      alertaUltradiano: false,
    },
    categoria: 'rotina',
    corHex: '#A8D8EA',
    icone: 'moon',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
  },
];

// ─────────────────────────────────────────────
// SALDO DO DIA (PRÉ-CALCULADO)
// ─────────────────────────────────────────────

/**
 * Cálculo manual para o dia de mock:
 * - Sono: 8h = 480 min
 * - Disponível: 1440 - 480 = 960 min (16h)
 * - Agendado: soma das durações = 840 min (14h)
 * - Livre: 960 - 840 = 120 min (2h de buffer)
 */
const MINUTOS_AGENDADOS = TAREFAS_MOCK.reduce((acc, t) => acc + t.duracaoMinutos, 0);
const SCORE_MEDIO = Math.round(
  TAREFAS_MOCK.reduce((acc, t) => acc + t.neurociencia.scoreAlinhamento, 0) / TAREFAS_MOCK.length
);

// ─────────────────────────────────────────────
// ENTRADA DO CALENDÁRIO
// ─────────────────────────────────────────────

export const ENTRADA_MOCK: EntradaCalendario = {
  saldo: {
    data: DATA_MOCK,
    totalMinutosDia: 1440,
    minutosReservadosSono: 480,       // 8h de sono
    minutosDisponiveis: 960,          // 16h livres
    minutosAgendados: MINUTOS_AGENDADOS,
    minutosLivres: 960 - MINUTOS_AGENDADOS,
    diaEstaSobregado: (960 - MINUTOS_AGENDADOS) < 0,
    temColisaoDetectada: false,
    idsEmColisao: [],
    scoreCognitivoMedio: SCORE_MEDIO,
  },
  tarefas: TAREFAS_MOCK,
};

// ─────────────────────────────────────────────
// CALENDÁRIO COMPLETO
// ─────────────────────────────────────────────

export const CALENDARIO_MOCK: Calendario = {
  [DATA_MOCK]: ENTRADA_MOCK,
};

// ─────────────────────────────────────────────
// IDs ÚTEIS PARA TESTES
// ─────────────────────────────────────────────

/**
 * IDs prontos para usar nos testes do Efeito Cascata.
 *
 * @example
 * // Testar: atrasar o Exercício em 30 min
 * aplicarEfeitoCascata({
 *   tarefas: TAREFAS_MOCK,
 *   idTarefaAtrasada: IDS_MOCK.EXERCICIO,
 *   minutosDeAtraso: 30,
 * });
 *
 * // Resultado esperado:
 * // → tarefa_003 (Foco Profundo) empurrada para 07:15
 * // → tarefa_004 (Reunião) NÃO se move (Hard Block)
 * // → Colisão detectada se Foco Profundo invadir a Reunião
 */
export const IDS_MOCK = {
  MANHA_HIGIENE:       'tarefa_001',
  EXERCICIO:           'tarefa_002', // ← bom ponto de teste
  FOCO_PROFUNDO:       'tarefa_003',
  REUNIAO:             'tarefa_004', // Hard Block
  REVISAO_EMAILS:      'tarefa_005',
  ALMOCO:              'tarefa_006',
  TAREFAS_ADMIN:       'tarefa_007',
  TRABALHO_TARDE:      'tarefa_008', // Hard Block
  PROJETO_CRIATIVO:    'tarefa_009',
  PAUSA_ULTRADIANA:    'tarefa_010',
  ESTUDO:              'tarefa_011',
  JANTAR:              'tarefa_012',
  LAZER:               'tarefa_013',
  ROTINA_NOTURNA:      'tarefa_014',
} as const;