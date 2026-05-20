/**
 * @file types.ts
 * @description Interfaces e Types centrais do app de gestão de tempo.
 * Baseado em Neurociência, Ritmos Circadianos e Ultradianos.
 *
 * Localização sugerida: /constants/types.ts
 */

// ─────────────────────────────────────────────
// ENUMS E UNIONS PRIMITIVOS
// ─────────────────────────────────────────────

/** Tipo de bloco de tarefa. Hard = horário fixo; Soft = pode flutuar. */
export type TipoBloco = 'hard' | 'soft';

/** Status de conclusão da tarefa no dia. */
export type StatusTarefa = 'pendente' | 'em_andamento' | 'concluida' | 'atrasada' | 'pulada';

/**
 * Nível de Carga Cognitiva da tarefa.
 * Usado para cruzar com a janela circadiana adequada.
 */
export type CargaCognitiva = 'baixa' | 'media' | 'alta';

/**
 * Janelas do Ritmo Circadiano.
 * - pico_analitico: 08:00–12:00 → Foco e análise profunda
 * - dip_pos_almoco: 13:00–16:00 → Baixa energia, tarefas de rotina
 * - pico_criativo:  16:00–20:00 → Criatividade e colaboração
 * - declinio:       20:00+      → Descanso e recuperação
 */
export type JanelaCircadiana =
  | 'pico_analitico'
  | 'dip_pos_almoco'
  | 'pico_criativo'
  | 'declinio'
  | 'fora_de_janela'; // ex: madrugada, horário de sono

// ─────────────────────────────────────────────
// TAGS DE NEUROCIÊNCIA
// ─────────────────────────────────────────────

/**
 * Metadados cognitivos de uma tarefa.
 * Calculados automaticamente ao salvar/atualizar a tarefa.
 */
export interface TagsNeurociencia {
  /** Nível de esforço cognitivo exigido pela tarefa. */
  cargaCognitiva: CargaCognitiva;

  /**
   * Janela circadiana em que a tarefa está agendada.
   * Preenchida pelo sistema ao posicionar a tarefa no tempo.
   */
  janelaCircadiana: JanelaCircadiana;

  /**
   * Score de alinhamento cognitivo (0–100).
   * 100 = tarefa de alta carga no pico analítico.
   * 0   = tarefa de alta carga no declínio noturno.
   */
  scoreAlinhamento: number;

  /**
   * Indica se a tarefa excede 90 min de foco ininterrupto.
   * Quando true, o sistema sugere um bloco de recuperação ultradiano.
   */
  alertaUltradiano: boolean;

  /**
   * Duração sugerida para a pausa ultradiana (minutos).
   * Preenchida apenas se alertaUltradiano === true.
   */
  duracaoPausaSugerida?: 15 | 20 | 30;
}

// ─────────────────────────────────────────────
// TAREFA (BLOCO DE TEMPO)
// ─────────────────────────────────────────────

/**
 * Representa um bloco de atividade no dia.
 * É a entidade central do app.
 */
export interface Tarefa {
  /** UUID único da tarefa. */
  id: string;

  /** Nome/descrição curta exibida ao usuário. */
  titulo: string;

  /** Descrição opcional com mais detalhes. */
  descricao?: string;

  // ── Posição no tempo ────────────────────────

  /**
   * Horário de início no formato "HH:MM" (24h).
   * Exemplo: "08:30"
   */
  horarioInicio: string;

  /**
   * Horário de término no formato "HH:MM" (24h).
   * Derivado de horarioInicio + duracaoMinutos.
   */
  horarioFim: string;

  /** Duração planejada em minutos. */
  duracaoMinutos: number;

  // ── Tipo e comportamento ────────────────────

  /**
   * Define se a tarefa pode flutuar no Efeito Cascata.
   * - 'hard': horário fixo; nunca é deslocado automaticamente.
   * - 'soft': pode ser empurrada para frente quando há atraso.
   */
  tipoBloco: TipoBloco;

  /** Estado atual de execução da tarefa. */
  status: StatusTarefa;

  /**
   * Minutos de atraso acumulados no dia.
   * Incrementado pelo usuário ao reportar um delay.
   */
  atrasosMinutos: number;

  // ── Neurociência ────────────────────────────

  /** Metadados cognitivos calculados pelo sistema. */
  neurociencia: TagsNeurociencia;

  // ── Metadados ───────────────────────────────

  /** Categoria visual (ex: "trabalho", "saúde", "lazer"). */
  categoria?: string;

  /** Cor hexadecimal opcional para exibição na timeline. */
  corHex?: string;

  /** Ícone identificador (nome de ícone Lucide ou similar). */
  icone?: string;

  /** Timestamp de criação (ISO 8601). */
  criadoEm: string;

  /** Timestamp da última atualização (ISO 8601). */
  atualizadoEm: string;
}

// ─────────────────────────────────────────────
// SALDO DO DIA
// ─────────────────────────────────────────────

/**
 * Representa o orçamento de tempo de um dia.
 * Calculado dinamicamente a partir das tarefas do dia.
 */
export interface SaldoDoDia {
  /** Data de referência no formato "YYYY-MM-DD". */
  data: string;

  // ── Orçamento base ──────────────────────────

  /** Total de minutos no dia (sempre 1440 = 24h × 60). */
  readonly totalMinutosDia: 1440;

  /** Minutos reservados para sono. Definido pelo usuário. */
  minutosReservadosSono: number;

  /**
   * Minutos "livres" após descontar sono.
   * = totalMinutosDia - minutosReservadosSono
   */
  minutosDisponiveis: number;

  // ── Uso atual ───────────────────────────────

  /** Soma dos minutos de todas as tarefas (hard + soft) agendadas. */
  minutosAgendados: number;

  /**
   * Saldo restante não agendado.
   * = minutosDisponiveis - minutosAgendados
   * Pode ser negativo (dia sobrecarregado).
   */
  minutosLivres: number;

  // ── Alertas ─────────────────────────────────

  /** True se minutosLivres < 0 (dia sobrecarregado). */
  diaEstaSobregado: boolean;

  /**
   * True se algum Soft Block colidiu com um Hard Block
   * após o recálculo em cascata.
   */
  temColisaoDetectada: boolean;

  /**
   * IDs das tarefas que estão em conflito de horário.
   * Populado pelo motor de cascata.
   */
  idsEmColisao: string[];

  // ── Score cognitivo do dia ──────────────────

  /**
   * Média dos scores de alinhamento cognitivo de todas as tarefas.
   * Indica o quão bem o dia está otimizado para o ritmo circadiano.
   */
  scoreCognitivoMedio: number;
}

// ─────────────────────────────────────────────
// CALENDÁRIO
// ─────────────────────────────────────────────

/**
 * Entrada de um dia no calendário.
 * Contém tarefas e o saldo calculado.
 */
export interface EntradaCalendario {
  /** Saldo e métricas do dia. */
  saldo: SaldoDoDia;

  /**
   * Lista ordenada de tarefas do dia.
   * Ordenada por horarioInicio (ASC).
   */
  tarefas: Tarefa[];
}

/**
 * Estrutura principal do calendário.
 * Chave = data no formato "YYYY-MM-DD".
 *
 * @example
 * const calendario: Calendario = {
 *   "2025-07-14": { saldo: {...}, tarefas: [...] },
 *   "2025-07-15": { saldo: {...}, tarefas: [...] },
 * }
 */
export type Calendario = Record<string, EntradaCalendario>;

// ─────────────────────────────────────────────
// PAYLOAD DO EFEITO CASCATA
// ─────────────────────────────────────────────

/** Parâmetros de entrada para o motor de recálculo em cascata. */
export interface PayloadCascata {
  /** Lista atual de tarefas do dia (será imutável internamente). */
  tarefas: Tarefa[];

  /** ID da tarefa que originou o atraso. */
  idTarefaAtrasada: string;

  /** Quantos minutos a tarefa está atrasando. Deve ser > 0. */
  minutosDeAtraso: number;
}

/** Resultado retornado pelo motor de cascata. */
export interface ResultadoCascata {
  /** Nova lista de tarefas com horários recalculados. */
  tarefasAtualizadas: Tarefa[];

  /** IDs dos Soft Blocks que foram deslocados. */
  blocosDesloCados: string[];

  /**
   * IDs dos Soft Blocks que colidiram com um Hard Block
   * e não puderam ser empurrados.
   */
  colisoes: string[];

  /**
   * Quanto tempo livre foi perdido no final do dia (minutos).
   * Representa o custo real do atraso.
   */
  minutosLivresPerdidos: number;
}