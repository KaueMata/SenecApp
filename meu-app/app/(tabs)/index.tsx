/**
 * app/(tabs)/index.tsx
 * Tela Principal — Timeline de Rotina Diária com Ritmos Circadianos
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  useCalendario,
  minutosParaHora,
  getJanelaCircadiana,
  avaliarCognicao,
  type BlocoTempo,
  type JanelaCircadiana,
} from '../../hooks/useCalendario';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMELINE_LEFT_OFFSET = 64;    // Espaço para labels de hora
const TIMELINE_WIDTH = SCREEN_WIDTH - TIMELINE_LEFT_OFFSET - 24;
const PIXELS_PER_MINUTE = 1.6;      // Densidade vertical da timeline
const HOUR_HEIGHT = PIXELS_PER_MINUTE * 60;

// ─────────────────────────────────────────────
// CONSTANTES DE JANELAS CIRCADIANAS
// ─────────────────────────────────────────────

const JANELAS_CONFIG: Record<
  JanelaCircadiana,
  { label: string; cor: string; corFundo: string; horario: string }
> = {
  pico_cognitivo: {
    label: '⚡ Pico Cognitivo',
    cor: '#FFD93D',
    corFundo: 'rgba(255, 217, 61, 0.08)',
    horario: '08–13h',
  },
  post_lunch_dip: {
    label: '😴 Post-Lunch Dip',
    cor: '#FF6B6B',
    corFundo: 'rgba(255, 107, 107, 0.08)',
    horario: '13–16h',
  },
  segundo_pico: {
    label: '🎨 Segundo Pico',
    cor: '#4ECDC4',
    corFundo: 'rgba(78, 205, 196, 0.08)',
    horario: '16–20h',
  },
  declinio: {
    label: '🌅 Declínio',
    cor: '#F7B731',
    corFundo: 'rgba(247, 183, 49, 0.06)',
    horario: '20–00h',
  },
  sono: {
    label: '🌙 Sono',
    cor: '#6C5CE7',
    corFundo: 'rgba(108, 92, 231, 0.1)',
    horario: '23–07h',
  },
};

// ─────────────────────────────────────────────
// COMPONENTE: Badge de Compatibilidade
// ─────────────────────────────────────────────

function BadgeCognitivo({ bloco }: { bloco: BlocoTempo }) {
  const avaliacao = avaliarCognicao(bloco);
  const cores = {
    otima:  { bg: '#00B894', text: '#fff' },
    boa:    { bg: '#0984E3', text: '#fff' },
    neutra: { bg: '#636E72', text: '#fff' },
    ruim:   { bg: '#D63031', text: '#fff' },
  };
  const { bg, text } = cores[avaliacao.compatibilidade];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text }]}>
        {avaliacao.pontuacao}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: Faixas de Janela Circadiana (fundo)
// ─────────────────────────────────────────────

function FaixasCircadianas() {
  const faixas = [
    { inicio: 8 * 60,  fim: 13 * 60, janela: 'pico_cognitivo' as JanelaCircadiana },
    { inicio: 13 * 60, fim: 16 * 60, janela: 'post_lunch_dip' as JanelaCircadiana },
    { inicio: 16 * 60, fim: 20 * 60, janela: 'segundo_pico' as JanelaCircadiana },
    { inicio: 20 * 60, fim: 24 * 60, janela: 'declinio' as JanelaCircadiana },
  ];

  return (
    <>
      {faixas.map(({ inicio, fim, janela }) => {
        const config = JANELAS_CONFIG[janela];
        const top = inicio * PIXELS_PER_MINUTE;
        const height = (fim - inicio) * PIXELS_PER_MINUTE;
        return (
          <View
            key={janela}
            style={[
              styles.faixaCircadiana,
              {
                top,
                height,
                backgroundColor: config.corFundo,
                borderLeftColor: config.cor,
              },
            ]}
          >
            <Text style={[styles.faixaLabel, { color: config.cor }]}>
              {config.label}
            </Text>
          </View>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: Marcador de Hora Atual
// ─────────────────────────────────────────────

function LinhaHoraAtual({ horaAtual }: { horaAtual: number }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.8,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const top = horaAtual * PIXELS_PER_MINUTE;

  return (
    <View style={[styles.linhaHoraAtual, { top }]} pointerEvents="none">
      <Animated.View
        style={[styles.dotHoraAtual, { transform: [{ scale: pulseAnim }] }]}
      />
      <View style={styles.linhaHoraAtualBar} />
      <Text style={styles.horaAtualLabel}>{minutosParaHora(horaAtual)}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: Card de Bloco na Timeline
// ─────────────────────────────────────────────

interface CardBlocoProps {
  bloco: BlocoTempo;
  onPress: (bloco: BlocoTempo) => void;
}

function CardBloco({ bloco, onPress }: CardBlocoProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: (bloco.inicioMinutos / 1440) * 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        delay: (bloco.inicioMinutos / 1440) * 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const top = bloco.inicioMinutos * PIXELS_PER_MINUTE;
  const height = Math.max(bloco.duracaoMinutos * PIXELS_PER_MINUTE, 32);
  const isCompact = height < 52;

  const avaliacao = avaliarCognicao(bloco);

  return (
    <Animated.View
      style={[
        styles.cardBloco,
        {
          top,
          height,
          //opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          borderLeftColor: bloco.cor ?? '#888',
          backgroundColor: `${bloco.cor ?? '#888'}18`,
          opacity: bloco.concluido ? 0.5 : fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardBlocoInner}
        onPress={() => onPress(bloco)}
        activeOpacity={0.75}
      >
        {/* Indicador de tipo */}
        {bloco.tipo === 'hard' && (
          <View style={styles.hardIndicator} />
        )}

        <View style={styles.cardBlocoContent}>
          <View style={styles.cardBlocoHeader}>
            <Text style={styles.cardBlocoIcone}>{bloco.icone ?? '📋'}</Text>
            {!isCompact && (
              <Text
                style={[styles.cardBlocoTitulo, bloco.concluido && styles.textTachado]}
                numberOfLines={1}
              >
                {bloco.titulo}
              </Text>
            )}
            {isCompact && (
              <Text style={styles.cardBlocoTituloCompact} numberOfLines={1}>
                {bloco.titulo}
              </Text>
            )}
          </View>

          {!isCompact && (
            <View style={styles.cardBlocoMeta}>
              <Text style={styles.cardBlocoHorario}>
                {minutosParaHora(bloco.inicioMinutos)} →{' '}
                {minutosParaHora(bloco.inicioMinutos + bloco.duracaoMinutos)}
              </Text>
              <BadgeCognitivo bloco={bloco} />
            </View>
          )}

          {/* Alerta de atraso */}
          {(bloco.atrasadoMinutos ?? 0) > 0 && (
            <View style={styles.alertaAtraso}>
              <Text style={styles.alertaAtrasoText}>
                +{bloco.atrasadoMinutos}min
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: Painel de Saldo
// ─────────────────────────────────────────────

function PainelSaldo() {
  const { getSaldoLivre, blocos } = useCalendario();
  const saldo = getSaldoLivre();
  const saldoHoras = Math.floor(Math.abs(saldo) / 60);
  const saldoMin = Math.abs(saldo) % 60;
  const percentual = Math.max(0, Math.min(100, (saldo / 1440) * 100));
  const negativo = saldo < 0;

  const blocoAtual = useCalendario((s) => s.getBlocoEmAndamento());
  const janela = blocoAtual
    ? JANELAS_CONFIG[getJanelaCircadiana(blocoAtual.inicioMinutos)]
    : null;

  return (
    <View style={styles.painelSaldo}>
      {/* Saldo de tempo */}
      <View style={styles.saldoContainer}>
        <Text style={styles.saldoLabel}>Saldo Livre</Text>
        <Text style={[styles.saldoValor, negativo && { color: '#FF6B6B' }]}>
          {negativo ? '−' : ''}{saldoHoras}h {saldoMin}min
        </Text>
        <View style={styles.saldoBarBg}>
          <View
            style={[
              styles.saldoBarFill,
              {
                width: `${percentual}%`,
                backgroundColor: negativo ? '#FF6B6B' : '#4ECDC4',
              },
            ]}
          />
        </View>
      </View>

      {/* Janela atual */}
      {janela && (
        <View style={[styles.janelaAtual, { borderColor: janela.cor }]}>
          <Text style={[styles.janelaAtualLabel, { color: janela.cor }]}>
            {janela.label}
          </Text>
          <Text style={styles.janelaAtualHorario}>{janela.horario}</Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: Alertas em Banner
// ─────────────────────────────────────────────

function AlertasBanner() {
  const { alertas, dispensarAlerta } = useCalendario();
  if (alertas.length === 0) return null;

  return (
    <View style={styles.alertasBanner}>
      {alertas.map((alerta, index) => (
        <View
          key={index}
          style={[
            styles.alertaItem,
            alerta.tipo === 'colisao_hard_block' && { borderLeftColor: '#FF6B6B' },
            alerta.tipo === 'ultradiano' && { borderLeftColor: '#FFD93D' },
            alerta.tipo === 'saldo_negativo' && { borderLeftColor: '#E17055' },
          ]}
        >
          <Text style={styles.alertaItemText} numberOfLines={2}>
            {alerta.tipo === 'colisao_hard_block' ? '🚨' :
             alerta.tipo === 'ultradiano' ? '🧠' : '⏰'}{' '}
            {alerta.mensagem}
          </Text>
          <TouchableOpacity onPress={() => dispensarAlerta(index)}>
            <Text style={styles.alertaFechar}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────
// TELA PRINCIPAL
// ─────────────────────────────────────────────

export default function RotinaDiaria() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const {
    getBlocosOrdenados,
    horaAtual,
    setHoraAtual,
    marcarConcluido,
    aplicarAtraso,
  } = useCalendario();

  const blocos = getBlocosOrdenados();

  // Atualiza hora atual a cada minuto
  useEffect(() => {
    const tick = () => {
      const agora = new Date();
      setHoraAtual(agora.getHours() * 60 + agora.getMinutes());
    };
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Scrolla para a hora atual ao montar
  useEffect(() => {
    const timeout = setTimeout(() => {
      const targetY = Math.max(0, horaAtual * PIXELS_PER_MINUTE - 120);
      scrollRef.current?.scrollTo({ y: targetY, animated: true });
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  const handlePressBloco = useCallback((bloco: BlocoTempo) => {
    const avaliacao = avaliarCognicao(bloco);
    const emojiCompat = {
      otima: '🟢',
      boa: '🔵',
      neutra: '⚪',
      ruim: '🔴',
    }[avaliacao.compatibilidade];

    Alert.alert(
      `${bloco.icone ?? '📋'} ${bloco.titulo}`,
      [
        `🕐 ${minutosParaHora(bloco.inicioMinutos)} → ${minutosParaHora(bloco.inicioMinutos + bloco.duracaoMinutos)}`,
        `⏱ Duração: ${bloco.duracaoMinutos}min`,
        `🧠 Carga: ${bloco.cargaCognitiva.charAt(0).toUpperCase() + bloco.cargaCognitiva.slice(1)}`,
        `${emojiCompat} ${avaliacao.descricao}`,
        bloco.tipo === 'hard' ? '🔒 Hard Block (fixo)' : '🔀 Soft Block (flexível)',
      ].join('\n'),
      [
        {
          text: bloco.concluido ? 'Reabrir' : '✅ Concluir',
          onPress: () => marcarConcluido(bloco.id),
        },
        bloco.tipo !== 'hard'
          ? {
              text: '⏰ Atrasar 15min',
              onPress: () => {
                aplicarAtraso(bloco.id, 15);
              },
              style: 'destructive',
            }
          : { text: 'OK' },
        { text: 'Fechar', style: 'cancel' },
      ]
    );
  }, [marcarConcluido, aplicarAtraso]);

  // Labels de hora (06h–24h)
  const horasLabels = Array.from({ length: 19 }, (_, i) => i + 6);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Rotina Diária</Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/modal')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Painel de saldo */}
      <PainelSaldo />

      {/* Alertas */}
      <AlertasBanner />

      {/* Timeline */}
      <ScrollView
        ref={scrollRef}
        style={styles.timelineScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.timelineContent}
      >
        {/* Faixas circadianas (fundo) */}
        <FaixasCircadianas />

        {/* Labels de hora + linhas de grade */}
        {horasLabels.map((hora) => {
          const top = hora * 60 * PIXELS_PER_MINUTE;
          return (
            <React.Fragment key={hora}>
              <View style={[styles.gridLinha, { top }]} pointerEvents="none" />
              <Text style={[styles.horaLabel, { top: top - 9 }]}>
                {hora.toString().padStart(2, '0')}h
              </Text>
            </React.Fragment>
          );
        })}

        {/* Blocos de tempo */}
        {blocos.map((bloco) => (
          <CardBloco
            key={bloco.id}
            bloco={bloco}
            onPress={handlePressBloco}
          />
        ))}

        {/* Linha da hora atual */}
        <LinhaHoraAtual horaAtual={horaAtual} />

        {/* Espaço extra no fundo */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Legenda de janelas circadianas */}
      <View style={styles.legendaContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(Object.entries(JANELAS_CONFIG) as [JanelaCircadiana, typeof JANELAS_CONFIG[JanelaCircadiana]][])
            .filter(([k]) => k !== 'sono')
            .map(([key, config]) => (
              <View key={key} style={styles.legendaItem}>
                <View style={[styles.legendaDot, { backgroundColor: config.cor }]} />
                <Text style={styles.legendaText}>{config.label.split(' ').slice(1).join(' ')}</Text>
              </View>
            ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },

  // ── Header ──────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F0F0FF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8888AA',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    fontSize: 24,
    color: '#0D0D1A',
    fontWeight: '700',
    lineHeight: 26,
    marginTop: Platform.OS === 'android' ? -2 : 0,
  },

  // ── Painel de Saldo ──────────────────────────
  painelSaldo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#161628',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#222240',
  },
  saldoContainer: {
    flex: 1,
  },
  saldoLabel: {
    fontSize: 11,
    color: '#8888AA',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  saldoValor: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4ECDC4',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  saldoBarBg: {
    height: 4,
    backgroundColor: '#222240',
    borderRadius: 2,
    overflow: 'hidden',
  },
  saldoBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  janelaAtual: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  janelaAtualLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  janelaAtualHorario: {
    fontSize: 10,
    color: '#8888AA',
    marginTop: 2,
  },

  // ── Alertas ──────────────────────────────────
  alertasBanner: {
    marginHorizontal: 16,
    marginBottom: 6,
    gap: 4,
  },
  alertaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD93D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  alertaItemText: {
    flex: 1,
    fontSize: 12,
    color: '#CCCCDD',
    lineHeight: 17,
  },
  alertaFechar: {
    fontSize: 14,
    color: '#666680',
    paddingLeft: 8,
  },

  // ── Timeline ─────────────────────────────────
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    marginLeft: TIMELINE_LEFT_OFFSET,
    paddingRight: 12,
    // Altura total: 24h * 60min * pixels_por_minuto
    minHeight: 24 * 60 * PIXELS_PER_MINUTE,
    position: 'relative',
  },

  // ── Grade de horas ────────────────────────────
  gridLinha: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#1E1E36',
  },
  horaLabel: {
    position: 'absolute',
    left: -TIMELINE_LEFT_OFFSET,
    width: TIMELINE_LEFT_OFFSET - 8,
    textAlign: 'right',
    fontSize: 11,
    color: '#555575',
    fontWeight: '500',
  },

  // ── Faixas circadianas ────────────────────────
  faixaCircadiana: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderLeftWidth: 2,
    paddingLeft: 6,
    paddingTop: 4,
  },
  faixaLabel: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.7,
    letterSpacing: 0.3,
  },

  // ── Card de bloco ─────────────────────────────
  cardBloco: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 10,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  cardBlocoInner: {
    flex: 1,
    flexDirection: 'row',
  },
  hardIndicator: {
    width: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  cardBlocoContent: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  cardBlocoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardBlocoIcone: {
    fontSize: 13,
  },
  cardBlocoTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E8E8FF',
    flex: 1,
  },
  cardBlocoTituloCompact: {
    fontSize: 11,
    fontWeight: '500',
    color: '#CCCCDD',
    flex: 1,
  },
  textTachado: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  cardBlocoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  cardBlocoHorario: {
    fontSize: 10,
    color: '#8888AA',
  },
  alertaAtraso: {
    position: 'absolute',
    right: 6,
    top: 4,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  alertaAtrasoText: {
    fontSize: 9,
    color: '#FF6B6B',
    fontWeight: '700',
  },

  // ── Badge cognitivo ───────────────────────────
  badge: {
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },

  // ── Linha hora atual ──────────────────────────
  linhaHoraAtual: {
    position: 'absolute',
    left: -TIMELINE_LEFT_OFFSET,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  dotHoraAtual: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B6B',
    marginLeft: TIMELINE_LEFT_OFFSET - 5,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  linhaHoraAtualBar: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#FF6B6B',
    opacity: 0.8,
  },
  horaAtualLabel: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: '700',
    marginLeft: 4,
    marginRight: 4,
  },

  // ── Legenda ───────────────────────────────────
  legendaContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E1E36',
    backgroundColor: '#0D0D1A',
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 5,
  },
  legendaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendaText: {
    fontSize: 11,
    color: '#8888AA',
  },
});
