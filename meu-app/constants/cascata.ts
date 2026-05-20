
/**
 * @file cascata.ts
 * @description Motor de Efeito Cascata (Opção B) e utilitários de Neurociência.
 * Funções puras — sem side effects, sem dependências externas.
 *
 * Localização sugerida: /constants/cascata.ts
 */

import type {
  Tarefa,
  JanelaCircadiana,
  CargaCognitiva,
  PayloadCascata,
  ResultadoCascata,
  SaldoDoDia,
  EntradaCalendario,
} from './types';

// ─────────────────────────────────────────────
// UTILITÁRIOS DE TEMPO
// ─────────────────────────────────────────────

/**
 * Converte "HH:MM" em minutos desde meia-noite.
 * @example horaParaMinutos("08:30") → 510
 */
export function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Converte minutos desde meia-noite em "HH:MM".
 * Aceita valores > 1440 (overflow para o dia seguinte) sem quebrar.
 * @example minutosParaHora(510) → "08:30"
 */
export function minutosParaHora(minutos: number): string {
  // Clamp para não ultrapassar 23:59 na exibição
  const total = Math.min(minutos, 23 * 60 + 59);
  const h = Math.floor(total / 60).toString().padStart(2, '0');
  const m = (total % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Recalcula horarioFim a partir de horarioInicio + duracaoMinutos.
 */
export function calcularHorarioFim(horarioInicio: string, duracaoMinutos: number): string {
  return minutosParaHora(horaParaMinutos(horarioInicio) + duracaoMinutos);
}

// ─────────────────────────────────────────────
// NEUROCIÊNCIA: JANELA CIRCADIANA
// ─────────────────────────────────────────────

/** Limites das janelas circadianas em minutos desde meia-noite. */
const JANELAS_CIRCADIANAS: Array<{
  janela: JanelaCircadiana;
  inicioMin: number;
  fimMin: number;
}> = [
  { janela: 'pico_analitico', inicioMin: 8 * 60,  fimMin: 12 * 60 }, // 08:00–12:00
  { janela: 'dip_pos_almoco', inicioMin: 13 * 60, fimMin: 16 * 60 }, // 13:00–16:00
  { janela: 'pico_criativo',  inicioMin: 16 * 60, fimMin: 20 * 60 }, // 16:00–20:00
  { janela: 'declinio',       inicioMin: 20 * 60, fimMin: 24 * 60 }, // 20:00–24:00
];

/**
 * Determina a janela circadiana de um horário.
 * Usa o início da tarefa como referência.
 */
export function detectarJanelaCircadiana(horarioInicio: string): JanelaCircadiana {
  const minutos = horaParaMinutos(horarioInicio);
  const janela = JANELAS_CIRCADIANAS.find(
    (j) => minutos >= j.inicioMin && minutos < j.fimMin
  );
  return janela?.janela ?? 'fora_de_janela';
}

// ─────────────────────────────────────────────
// NEUROCIÊNCIA: SCORE DE ALINHAMENTO
// ─────────────────────────────────────────────

/**
 * Tabela de score base por combinação carga × janela.
 * Quanto maior, mais alinhado cognitivamente.
 *
 * Lógica:
 * - Alta carga no pico analítico = 100 (ótimo)
 * - Alta carga no declínio = 10 (péssimo)
 * - Baixa carga em qualquer janela = sempre razoável (60+)
 */
const SCORE_ALINHAMENTO: Record<CargaCognitiva, Record<JanelaCircadiana, number>> = {
  alta: {
    pico_analitico: 100,
    pico_criativo:  80,
    dip_pos_almoco: 30,
    declinio:       10,
    fora_de_janela: 20,
  },
  media: {
    pico_analitico: 85,
    pico_criativo:  75,
    dip_pos_almoco: 55,
    declinio:       35,
    fora_de_janela: 40,
  },
  baixa: {
    pico_analitico: 70,
    pico_criativo:  70,
    dip_pos_almoco: 80, // tarefas leves são ideais no dip
    declinio:       65,
    fora_de_janela: 60,
  },
};

/**
 * Calcula o score de alinhamento cognitivo (0–100).
 */
export function calcularScoreAlinhamento(
  cargaCognitiva: CargaCognitiva,
  janela: JanelaCircadiana
): number {
  return SCORE_ALINHAMENTO[cargaCognitiva][janela];
}

// ─────────────────────────────────────────────
// NEUROCIÊNCIA: ALERTA ULTRADIANO
// ─────────────────────────────────────────────

/** Limite de foco contínuo antes de sugerir pausa (90 minutos). */
const LIMITE_ULTRADIANO_MIN = 90;

/**
 * Verifica se a tarefa viola o ritmo ultradiano (> 90 min de foco).
 * Retorna duração da pausa sugerida ou undefined se não aplicável.
 */
export function calcularPausaUltradiana(
  duracaoMinutos: number,
  cargaCognitiva: CargaCognitiva
): 15 | 20 | 30 | undefined {
  // Apenas tarefas de carga média/alta disparam o alerta
  if (cargaCognitiva === 'baixa') return undefined;
  if (duracaoMinutos <= LIMITE_ULTRADIANO_MIN) return undefined;

  // Quanto maior a carga e a duração, maior a pausa sugerida
  if (cargaCognitiva === 'alta' && duracaoMinutos > 120) return 30;
  if (cargaCognitiva === 'alta') return 20;
  return 15;
}

// ─────────────────────────────────────────────
// FACTORY: RECALCULAR TAGS DE NEUROCIÊNCIA
// ─────────────────────────────────────────────

/**
 * Recalcula as TagsNeurociencia de uma tarefa com base em seu
 * horário atual e configurações. Função pura.
 */
export function recalcularNeurociencia(
  tarefa: Pick<Tarefa, 'horarioInicio' | 'duracaoMinutos' | 'neurociencia'>
): Tarefa['neurociencia'] {
  const { cargaCognitiva } = tarefa.neurociencia;
  const janela = detectarJanelaCircadiana(tarefa.horarioInicio);
  const score = calcularScoreAlinhamento(cargaCognitiva, janela);
  const duracaoPausa = calcularPausaUltradiana(tarefa.duracaoMinutos, cargaCognitiva);

  return {
    cargaCognitiva,
    janelaCircadiana: janela,
    scoreAlinhamento: score,
    alertaUltradiano: duracaoPausa !== undefined,
    duracaoPausaSugerida: duracaoPausa,
  };
}

// ─────────────────────────────────────────────
// MOTOR DE EFEITO CASCATA
// ─────────────────────────────────────────────

/**
 * Aplica o Efeito Cascata (Opção B) na lista de tarefas do dia.
 *
 * Comportamento:
 * 1. Localiza a tarefa que atrasou.
 * 2. Marca ela como 'atrasada' e registra os minutos de atraso.
 * 3. Percorre todas as tarefas POSTERIORES em ordem de horário:
 *    - Se for Soft Block: empurra o horário de início pelo atraso acumulado.
 *    - Se for Hard Block: verifica colisão com o bloco anterior.
 * 4. Detecta colisões (Soft Block seria empurrado para dentro de um Hard Block).
 * 5. Recalcula as TagsNeurociencia de cada bloco deslocado.
 * 6. Retorna um ResultadoCascata imutável (não modifica o array original).
 *
 * @param payload - Parâmetros do recálculo.
 * @returns ResultadoCascata com a nova lista e metadados do impacto.
 */
export function aplicarEfeitoCascata(payload: PayloadCascata): ResultadoCascata {
  const { tarefas, idTarefaAtrasada, minutosDeAtraso } = payload;

  if (minutosDeAtraso <= 0) {
    // Sem atraso real: retorna cópia sem modificações
    return {
      tarefasAtualizadas: [...tarefas],
      blocosDesloCados: [],
      colisoes: [],
      minutosLivresPerdidos: 0,
    };
  }

  // 1. Deep clone para garantir imutabilidade do array original
  const listaCopia: Tarefa[] = tarefas.map((t) => ({ ...t, neurociencia: { ...t.neurociencia } }));

  // 2. Ordenar por horário de início (ASC) para garantir ordem cronológica
  listaCopia.sort(
    (a, b) => horaParaMinutos(a.horarioInicio) - horaParaMinutos(b.horarioInicio)
  );

  // 3. Localizar a tarefa-gatilho
  const indiceTarefaAtrasada = listaCopia.findIndex((t) => t.id === idTarefaAtrasada);

  if (indiceTarefaAtrasada === -1) {
    console.warn(`[Cascata] Tarefa com id "${idTarefaAtrasada}" não encontrada.`);
    return {
      tarefasAtualizadas: listaCopia,
      blocosDesloCados: [],
      colisoes: [],
      minutosLivresPerdidos: 0,
    };
  }

  // 4. Atualizar a tarefa que atrasou
  const tarefaGatilho = listaCopia[indiceTarefaAtrasada];
  listaCopia[indiceTarefaAtrasada] = {
    ...tarefaGatilho,
    status: 'atrasada',
    atrasosMinutos: tarefaGatilho.atrasosMinutos + minutosDeAtraso,
    // A duração dela mesma não muda; o fim dela avança
    horarioFim: calcularHorarioFim(tarefaGatilho.horarioInicio, tarefaGatilho.duracaoMinutos + minutosDeAtraso),
    atualizadoEm: new Date().toISOString(),
  };

  // 5. Percorrer tarefas posteriores e aplicar o cascata
  const blocosDesloCados: string[] = [];
  const colisoes: string[] = [];
  let atrasoCumulativo = minutosDeAtraso;

  for (let i = indiceTarefaAtrasada + 1; i < listaCopia.length; i++) {
    const tarefaAtual = listaCopia[i];

    if (tarefaAtual.tipoBloco === 'hard') {
      // Hard Block: não desloca, mas verifica se o bloco anterior invadiu seu horário
      const inicioPrevisto = horaParaMinutos(listaCopia[i - 1].horarioFim);
      const inicioHard = horaParaMinutos(tarefaAtual.horarioInicio);

      if (inicioPrevisto > inicioHard) {
        // Colisão detectada: o bloco anterior vai até dentro do Hard Block
        colisoes.push(tarefaAtual.id);
      }

      // Hard Block "absorve" o atraso: o cascata não passa por ele
      // O tempo livre é consumido antes do Hard Block
      atrasoCumulativo = 0;
      continue;
    }

    // Soft Block: deslocar pelo atraso cumulativo
    if (atrasoCumulativo <= 0) continue;

    const novoInicioMin = horaParaMinutos(tarefaAtual.horarioInicio) + atrasoCumulativo;

    // Verificar se o deslocamento colide com algum Hard Block futuro
    const proximoHard = listaCopia
      .slice(i + 1)
      .find((t) => t.tipoBloco === 'hard');

    if (proximoHard) {
      const fimDeslocadoMin = novoInicioMin + tarefaAtual.duracaoMinutos;
      const inicioProximoHardMin = horaParaMinutos(proximoHard.horarioInicio);

      if (fimDeslocadoMin > inicioProximoHardMin) {
        // O Soft Block empurrado vai invadir o próximo Hard Block
        colisoes.push(tarefaAtual.id);
        // Ainda deslocamos (é o comportamento esperado para alertar),
        // mas registramos a colisão
      }
    }

    const novoInicio = minutosParaHora(novoInicioMin);
    const novoFim = calcularHorarioFim(novoInicio, tarefaAtual.duracaoMinutos);

    // Recalcular neurociência com o novo horário
    const novasTagsNeuro = recalcularNeurociencia({
      horarioInicio: novoInicio,
      duracaoMinutos: tarefaAtual.duracaoMinutos,
      neurociencia: tarefaAtual.neurociencia,
    });

    listaCopia[i] = {
      ...tarefaAtual,
      horarioInicio: novoInicio,
      horarioFim: novoFim,
      neurociencia: novasTagsNeuro,
      atualizadoEm: new Date().toISOString(),
    };

    blocosDesloCados.push(tarefaAtual.id);
  }

  // 6. Calcular minutos livres perdidos no final do dia
  // (quanto o atraso "comeu" do tempo livre restante)
  const minutosLivresPerdidos = colisoes.length > 0
    ? minutosDeAtraso // colisões significam que o atraso não pôde ser absorvido
    : Math.max(0, minutosDeAtraso - 0); // simplificado; pode ser refinado com o SaldoDoDia

  return {
    tarefasAtualizadas: listaCopia,
    blocosDesloCados,
    colisoes,
    minutosLivresPerdidos,
  };
}

// ─────────────────────────────────────────────
// FACTORY: CALCULAR SALDO DO DIA
// ─────────────────────────────────────────────

/**
 * Recalcula o SaldoDoDia com base na lista atual de tarefas.
 * Deve ser chamada sempre que tarefas forem adicionadas, removidas ou alteradas.
 *
 * @param data - Data no formato "YYYY-MM-DD".
 * @param tarefas - Lista de tarefas do dia.
 * @param minutosReservadosSono - Minutos de sono configurados pelo usuário.
 */
export function calcularSaldoDoDia(
  data: string,
  tarefas: Tarefa[],
  minutosReservadosSono: number
): SaldoDoDia {
  const TOTAL_MIN_DIA = 1440;
  const minutosDisponiveis = TOTAL_MIN_DIA - minutosReservadosSono;

  const minutosAgendados = tarefas.reduce((acc, t) => acc + t.duracaoMinutos, 0);
  const minutosLivres = minutosDisponiveis - minutosAgendados;

  // IDs em colisão: Soft Blocks que se sobrepõem a Hard Blocks
  const idsEmColisao = detectarColisoes(tarefas);

  // Score cognitivo médio do dia
  const scoreCognitivoMedio =
    tarefas.length > 0
      ? Math.round(
          tarefas.reduce((acc, t) => acc + t.neurociencia.scoreAlinhamento, 0) / tarefas.length
        )
      : 0;

  return {
    data,
    totalMinutosDia: 1440,
    minutosReservadosSono,
    minutosDisponiveis,
    minutosAgendados,
    minutosLivres,
    diaEstaSobregado: minutosLivres < 0,
    temColisaoDetectada: idsEmColisao.length > 0,
    idsEmColisao,
    scoreCognitivoMedio,
  };
}

/**
 * Detecta colisões entre tarefas (sobreposição de horários).
 * Retorna os IDs das tarefas que estão em conflito.
 */
function detectarColisoes(tarefas: Tarefa[]): string[] {
  const ordenadas = [...tarefas].sort(
    (a, b) => horaParaMinutos(a.horarioInicio) - horaParaMinutos(b.horarioInicio)
  );

  const idsEmColisao = new Set<string>();

  for (let i = 0; i < ordenadas.length - 1; i++) {
    const atual = ordenadas[i];
    const proxima = ordenadas[i + 1];

    const fimAtualMin = horaParaMinutos(atual.horarioFim);
    const inicioProximoMin = horaParaMinutos(proxima.horarioInicio);

    if (fimAtualMin > inicioProximoMin) {
      idsEmColisao.add(atual.id);
      idsEmColisao.add(proxima.id);
    }
  }

  return Array.from(idsEmColisao);
}

// ─────────────────────────────────────────────
// FACTORY: RECONSTRUIR ENTRADA DO CALENDÁRIO
// ─────────────────────────────────────────────

/**
 * Utilitário de conveniência: aplica o efeito cascata e recalcula
 * o saldo do dia em uma única chamada. Retorna a EntradaCalendario atualizada.
 *
 * @example
 * const novaEntrada = aplicarCascataERecalcularDia({
 *   entradaAtual: calendario["2025-07-14"],
 *   idTarefaAtrasada: "uuid-123",
 *   minutosDeAtraso: 20,
 *   minutosReservadosSono: 480, // 8h
 * });
 */
export function aplicarCascataERecalcularDia(params: {
  entradaAtual: EntradaCalendario;
  idTarefaAtrasada: string;
  minutosDeAtraso: number;
  minutosReservadosSono: number;
}): EntradaCalendario & { metadados: Omit<ResultadoCascata, 'tarefasAtualizadas'> } {
  const { entradaAtual, idTarefaAtrasada, minutosDeAtraso, minutosReservadosSono } = params;

  const resultado = aplicarEfeitoCascata({
    tarefas: entradaAtual.tarefas,
    idTarefaAtrasada,
    minutosDeAtraso,
  });

  const novoSaldo = calcularSaldoDoDia(
    entradaAtual.saldo.data,
    resultado.tarefasAtualizadas,
    minutosReservadosSono
  );

  return {
    saldo: novoSaldo,
    tarefas: resultado.tarefasAtualizadas,
    metadados: {
      blocosDesloCados: resultado.blocosDesloCados,
      colisoes: resultado.colisoes,
      minutosLivresPerdidos: resultado.minutosLivresPerdidos,
    },
  };
}