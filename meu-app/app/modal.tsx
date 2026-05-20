/**
 * app/modal.tsx
 * Modal de criação e edição de Blocos de Tempo
 * Estética: dark industrial com acentos neon — precisa, densa, sem ornamentos desnecessários.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  useCalendario,
  horaParaMinutos,
  minutosParaHora,
  getJanelaCircadiana,
  avaliarCognicao,
  verificarUltradiano,
  type TipoBloco,
  type CargaCognitiva,
  type BlocoTempo,
} from '../hooks/useCalendario';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─────────────────────────────────────────────
// DADOS DE CONFIGURAÇÃO
// ─────────────────────────────────────────────

const ICONES = [
  '💼', '📚', '🏋️', '🍽️', '🧘', '☀️', '🌙', '💻',
  '📞', '✍️', '🎨', '🎵', '🚗', '🏃', '💊', '🛒',
  '👨‍👩‍👧', '🤝', '📊', '🎯', '🧠', '⚡', '🔥', '💡',
];

const CORES = [
  '#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77',
  '#4ECDC4', '#45B7D1', '#6C5CE7', '#A29BFE',
  '#FD79A8', '#E17055', '#00B894', '#0984E3',
];

const PRESETS = [
  { titulo: 'Trabalho', icone: '💼', tipo: 'hard' as TipoBloco, cor: '#FF6B6B', carga: 'alta' as CargaCognitiva, duracao: 240 },
  { titulo: 'Estudos', icone: '📚', tipo: 'soft' as TipoBloco, cor: '#4ECDC4', carga: 'alta' as CargaCognitiva, duracao: 90 },
  { titulo: 'Exercício', icone: '🏋️', tipo: 'soft' as TipoBloco, cor: '#45B7D1', carga: 'baixa' as CargaCognitiva, duracao: 60 },
  { titulo: 'Refeição', icone: '🍽️', tipo: 'soft' as TipoBloco, cor: '#FFD93D', carga: 'baixa' as CargaCognitiva, duracao: 45 },
  { titulo: 'Meditação', icone: '🧘', tipo: 'soft' as TipoBloco, cor: '#A29BFE', carga: 'baixa' as CargaCognitiva, duracao: 20 },
  { titulo: 'Reunião', icone: '🤝', tipo: 'hard' as TipoBloco, cor: '#FD79A8', carga: 'media' as CargaCognitiva, duracao: 60 },
];

// ─────────────────────────────────────────────
// COMPONENTE: Seletor de Hora (Drum Picker)
// ─────────────────────────────────────────────

interface DrumPickerProps {
  label: string;
  value: number; // minutos
  onChange: (minutos: number) => void;
}

function DrumPicker({ label, value, onChange }: DrumPickerProps) {
  const [editando, setEditando] = useState(false);
  const [inputVal, setInputVal] = useState(minutosParaHora(value));
  const inputRef = useRef<TextInput>(null);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const hora = Math.floor(value / 60);
  const minuto = value % 60;

  const incrementar = (campo: 'hora' | 'min', delta: number) => {
    if (campo === 'hora') {
      const novaHora = ((hora + delta) % 24 + 24) % 24;
      onChange(novaHora * 60 + minuto);
    } else {
      const novoMin = ((minuto + delta) % 60 + 60) % 60;
      onChange(hora * 60 + novoMin);
    }
  };

  const confirmarInput = () => {
    const match = inputVal.match(/^(\d{1,2}):?(\d{0,2})$/);
    if (match) {
      const h = Math.min(23, parseInt(match[1] || '0'));
      const m = Math.min(59, parseInt(match[2] || '0'));
      onChange(h * 60 + m);
    }
    setEditando(false);
    setInputVal(minutosParaHora(value));
  };

  useEffect(() => {
    if (editando) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [editando]);

  return (
    <View style={drumStyles.container}>
      <Text style={drumStyles.label}>{label}</Text>
      {editando ? (
        <TextInput
          ref={inputRef}
          style={drumStyles.input}
          value={inputVal}
          onChangeText={setInputVal}
          onBlur={confirmarInput}
          onSubmitEditing={confirmarInput}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />
      ) : (
        <TouchableOpacity onPress={() => setEditando(true)} style={drumStyles.display}>
          {/* Horas */}
          <View style={drumStyles.coluna}>
            <TouchableOpacity onPress={() => incrementar('hora', 1)} hitSlop={HIT_SLOP}>
              <Text style={drumStyles.arrow}>▲</Text>
            </TouchableOpacity>
            <Text style={drumStyles.valor}>{hora.toString().padStart(2, '0')}</Text>
            <TouchableOpacity onPress={() => incrementar('hora', -1)} hitSlop={HIT_SLOP}>
              <Text style={drumStyles.arrow}>▼</Text>
            </TouchableOpacity>
          </View>
          <Text style={drumStyles.separador}>:</Text>
          {/* Minutos */}
          <View style={drumStyles.coluna}>
            <TouchableOpacity onPress={() => incrementar('min', 5)} hitSlop={HIT_SLOP}>
              <Text style={drumStyles.arrow}>▲</Text>
            </TouchableOpacity>
            <Text style={drumStyles.valor}>{minuto.toString().padStart(2, '0')}</Text>
            <TouchableOpacity onPress={() => incrementar('min', -5)} hitSlop={HIT_SLOP}>
              <Text style={drumStyles.arrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

const drumStyles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1 },
  label: { fontSize: 10, color: '#666688', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  display: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coluna: { alignItems: 'center', gap: 2 },
  arrow: { fontSize: 10, color: '#4ECDC4', lineHeight: 14 },
  valor: { fontSize: 28, fontWeight: '700', color: '#F0F0FF', lineHeight: 34, letterSpacing: -1 },
  separador: { fontSize: 24, fontWeight: '700', color: '#4ECDC4', marginBottom: 4 },
  input: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4ECDC4',
    borderBottomWidth: 1,
    borderBottomColor: '#4ECDC4',
    textAlign: 'center',
    minWidth: 80,
  },
});

// ─────────────────────────────────────────────
// COMPONENTE: Slider de Duração
// ─────────────────────────────────────────────

const DURACAO_STEPS = [15, 20, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300, 360, 480];

function SliderDuracao({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const idx = DURACAO_STEPS.findIndex((s) => s >= value);
  const currentIdx = idx === -1 ? DURACAO_STEPS.length - 1 : idx;

  const formatarDuracao = (min: number) => {
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h}h` : `${h}h${m}min`;
  };

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.header}>
        <Text style={sliderStyles.label}>Duração</Text>
        <Text style={sliderStyles.valor}>{formatarDuracao(value)}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={sliderStyles.steps}
      >
        {DURACAO_STEPS.map((step, i) => (
          <TouchableOpacity
            key={step}
            style={[
              sliderStyles.step,
              i === currentIdx && sliderStyles.stepAtivo,
              step > 90 && sliderStyles.stepLong,
            ]}
            onPress={() => onChange(step)}
          >
            <Text
              style={[
                sliderStyles.stepText,
                i === currentIdx && sliderStyles.stepTextAtivo,
              ]}
            >
              {formatarDuracao(step)}
            </Text>
            {step === 90 && (
              <View style={sliderStyles.stepDivider}>
                <Text style={sliderStyles.stepDividerText}>90′</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      {value > 90 && (
        <Text style={sliderStyles.ultradianoAviso}>
          🧠 Ritmo ultradiano: considere uma pausa após 90min
        </Text>
      )}
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: { marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  label: { fontSize: 12, color: '#666688', letterSpacing: 0.8, textTransform: 'uppercase' },
  valor: { fontSize: 20, fontWeight: '700', color: '#4ECDC4', letterSpacing: -0.5 },
  steps: { gap: 6, paddingVertical: 4 },
  step: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#222244',
  },
  stepAtivo: {
    backgroundColor: '#4ECDC420',
    borderColor: '#4ECDC4',
  },
  stepLong: {
    borderColor: '#FF6B6B30',
  },
  stepText: { fontSize: 12, color: '#666688' },
  stepTextAtivo: { color: '#4ECDC4', fontWeight: '700' },
  stepDivider: {
    position: 'absolute', top: -8, right: -2,
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
    paddingHorizontal: 3,
  },
  stepDividerText: { fontSize: 8, color: '#fff', fontWeight: '700' },
  ultradianoAviso: {
    fontSize: 11,
    color: '#FFD93D',
    marginTop: 8,
    paddingLeft: 4,
  },
});

// ─────────────────────────────────────────────
// COMPONENTE: Preview de Impacto Cognitivo
// ─────────────────────────────────────────────

function PreviewCognitivo({
  inicioMinutos,
  cargaCognitiva,
  duracaoMinutos,
  titulo,
}: {
  inicioMinutos: number;
  cargaCognitiva: CargaCognitiva;
  duracaoMinutos: number;
  titulo: string;
}) {
  const blocoFake: BlocoTempo = {
    id: '_preview',
    titulo,
    tipo: 'soft',
    inicioMinutos,
    duracaoMinutos,
    cargaCognitiva,
  };

  const avaliacao = avaliarCognicao(blocoFake);
  const alerta = verificarUltradiano(blocoFake);

  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: avaliacao.pontuacao / 100,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [avaliacao.pontuacao]);

  const corBarra = avaliacao.pontuacao >= 70
    ? '#00B894'
    : avaliacao.pontuacao >= 45
    ? '#FFD93D'
    : '#FF6B6B';

  const emojiJanela: Record<string, string> = {
    pico_cognitivo: '⚡',
    post_lunch_dip: '😴',
    segundo_pico: '🎨',
    declinio: '🌅',
    sono: '🌙',
  };

  return (
    <View style={previewStyles.container}>
      <View style={previewStyles.header}>
        <Text style={previewStyles.titulo}>Impacto Cognitivo</Text>
        <Text style={previewStyles.janela}>
          {emojiJanela[avaliacao.janela]}{' '}
          {avaliacao.janela.replace(/_/g, ' ')}
        </Text>
      </View>

      <View style={previewStyles.barContainer}>
        <Animated.View
          style={[
            previewStyles.bar,
            {
              width: barAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: corBarra,
            },
          ]}
        />
        <Text style={previewStyles.pontuacao}>{avaliacao.pontuacao}</Text>
      </View>

      <Text style={[previewStyles.descricao, { color: corBarra }]}>
        {avaliacao.descricao}
      </Text>

      {alerta && (
        <View style={previewStyles.alertaUltradiano}>
          <Text style={previewStyles.alertaUltradianoText}>
            🧠 {alerta.mensagem}
          </Text>
        </View>
      )}
    </View>
  );
}

const previewStyles = StyleSheet.create({
  container: {
    backgroundColor: '#111122',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E1E40',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titulo: { fontSize: 11, color: '#666688', letterSpacing: 0.8, textTransform: 'uppercase' },
  janela: { fontSize: 11, color: '#8888AA', textTransform: 'capitalize' },
  barContainer: {
    height: 6,
    backgroundColor: '#1E1E40',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  bar: { height: '100%', borderRadius: 3 },
  pontuacao: {
    position: 'absolute',
    right: 0,
    top: -14,
    fontSize: 10,
    color: '#8888AA',
    fontWeight: '700',
  },
  descricao: { fontSize: 12, lineHeight: 17 },
  alertaUltradiano: {
    marginTop: 8,
    backgroundColor: '#FFD93D18',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#FFD93D',
  },
  alertaUltradianoText: { fontSize: 11, color: '#FFD93D', lineHeight: 16 },
});

// ─────────────────────────────────────────────
// TELA MODAL PRINCIPAL
// ─────────────────────────────────────────────

type Step = 'preset' | 'form';

export default function ModalBloco() {
  const router = useRouter();
  const params = useLocalSearchParams<{ blocoId?: string }>();
  const { adicionarBloco, atualizarBloco, removerBloco, blocos } = useCalendario();

  const blocoExistente = params.blocoId
    ? blocos.find((b) => b.id === params.blocoId)
    : undefined;

  // ── Estado do formulário ─────────────────────
  const [step, setStep] = useState<Step>(blocoExistente ? 'form' : 'preset');
  const [titulo, setTitulo] = useState(blocoExistente?.titulo ?? '');
  const [tipo, setTipo] = useState<TipoBloco>(blocoExistente?.tipo ?? 'soft');
  const [inicioMinutos, setInicioMinutos] = useState(
    blocoExistente?.inicioMinutos ?? (() => {
      const agora = new Date();
      return agora.getHours() * 60 + agora.getMinutes();
    })()
  );
  const [duracao, setDuracao] = useState(blocoExistente?.duracaoMinutos ?? 60);
  const [carga, setCarga] = useState<CargaCognitiva>(blocoExistente?.cargaCognitiva ?? 'media');
  const [cor, setCor] = useState(blocoExistente?.cor ?? CORES[0]);
  const [icone, setIcone] = useState(blocoExistente?.icone ?? '📋');

  // Animações
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goToForm = useCallback((preset?: typeof PRESETS[0]) => {
    if (preset) {
      setTitulo(preset.titulo);
      setTipo(preset.tipo);
      setCarga(preset.carga);
      setCor(preset.cor);
      setIcone(preset.icone);
      setDuracao(preset.duracao);
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep('form');
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const handleSalvar = useCallback(() => {
    if (!titulo.trim()) return;

    const dados = {
      titulo: titulo.trim(),
      tipo,
      inicioMinutos,
      duracaoMinutos: duracao,
      cargaCognitiva: carga,
      cor,
      icone,
    };

    if (blocoExistente) {
      atualizarBloco(blocoExistente.id, dados);
    } else {
      adicionarBloco(dados);
    }
    router.back();
  }, [titulo, tipo, inicioMinutos, duracao, carga, cor, icone, blocoExistente]);

  const handleExcluir = useCallback(() => {
    if (blocoExistente) {
      removerBloco(blocoExistente.id);
      router.back();
    }
  }, [blocoExistente]);

  const podeсалvar = titulo.trim().length > 0;

  // ── STEP 1: Seleção de Preset ────────────────
  if (step === 'preset') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo Bloco</Text>
          <TouchableOpacity onPress={() => goToForm()} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>Em branco</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.presetGrid} showsVerticalScrollIndicator={false}>
          <Text style={styles.presetSectionTitle}>Início rápido</Text>
          <View style={styles.presetRow}>
            {PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.titulo}
                style={[styles.presetCard, { borderColor: preset.cor + '40' }]}
                onPress={() => goToForm(preset)}
                activeOpacity={0.7}
              >
                <View style={[styles.presetIconeWrap, { backgroundColor: preset.cor + '20' }]}>
                  <Text style={styles.presetIcone}>{preset.icone}</Text>
                </View>
                <Text style={styles.presetCardTitulo}>{preset.titulo}</Text>
                <Text style={styles.presetCardMeta}>
                  {preset.tipo === 'hard' ? '🔒' : '🔀'}{' '}
                  {Math.floor(preset.duracao / 60) > 0
                    ? `${Math.floor(preset.duracao / 60)}h`
                    : ''}{preset.duracao % 60 > 0
                    ? `${preset.duracao % 60}min`
                    : ''}
                </Text>
                <View style={[styles.presetCorDot, { backgroundColor: preset.cor }]} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.presetDivider} />

          <TouchableOpacity
            style={styles.presetCustom}
            onPress={() => goToForm()}
          >
            <Text style={styles.presetCustomIcone}>＋</Text>
            <View>
              <Text style={styles.presetCustomTitulo}>Bloco personalizado</Text>
              <Text style={styles.presetCustomSub}>Configure cada detalhe</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── STEP 2: Formulário ───────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (blocoExistente ? router.back() : setStep('preset'))}
            style={styles.closeBtn}
          >
            <Text style={styles.closeBtnText}>{blocoExistente ? '✕' : '←'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {blocoExistente ? 'Editar Bloco' : 'Novo Bloco'}
          </Text>
          <TouchableOpacity
            onPress={handleSalvar}
            style={[styles.saveBtn, !podeСалvar && styles.saveBtnDisabled]}
            disabled={!podeСалvar}
          >
            <Text style={[styles.saveBtnText, !podeСалvar && { opacity: 0.4 }]}>
              {blocoExistente ? 'Salvar' : 'Criar'}
            </Text>
          </TouchableOpacity>
        </View>

        <Animated.ScrollView
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Título + ícone */}
          <View style={styles.tituloRow}>
            <TouchableOpacity style={styles.iconePicker} onPress={() => {}}>
              <Text style={styles.iconePickerEmoji}>{icone}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.tituloInput}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Nome da atividade..."
              placeholderTextColor="#444466"
              maxLength={40}
              returnKeyType="done"
            />
          </View>

          {/* Seletor de ícones */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.iconesScroll}
            contentContainerStyle={styles.iconesContent}
          >
            {ICONES.map((i) => (
              <TouchableOpacity
                key={i}
                style={[styles.iconeBtn, icone === i && styles.iconeBtnAtivo]}
                onPress={() => setIcone(i)}
              >
                <Text style={styles.iconeBtnEmoji}>{i}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Horários */}
          <View style={styles.secao}>
            <View style={styles.horarioRow}>
              <DrumPicker
                label="Início"
                value={inicioMinutos}
                onChange={setInicioMinutos}
              />
              <View style={styles.horarioDivisor} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={drumStyles.label}>Término</Text>
                <Text style={styles.horarioFim}>
                  {minutosParaHora(inicioMinutos + duracao)}
                </Text>
              </View>
            </View>
          </View>

          {/* Duração */}
          <SliderDuracao value={duracao} onChange={setDuracao} />

          {/* Tipo de bloco */}
          <View style={styles.secao}>
            <Text style={styles.secaoLabel}>Tipo de Bloco</Text>
            <View style={styles.tipoRow}>
              {([
                { valor: 'hard', emoji: '🔒', desc: 'Fixo' },
                { valor: 'soft', emoji: '🔀', desc: 'Flexível' },
                { valor: 'recuperacao', emoji: '🧘', desc: 'Pausa' },
              ] as { valor: TipoBloco; emoji: string; desc: string }[]).map(({ valor, emoji, desc }) => (
                <TouchableOpacity
                  key={valor}
                  style={[styles.tipoBtn, tipo === valor && styles.tipoBtnAtivo]}
                  onPress={() => setTipo(valor)}
                >
                  <Text style={styles.tipoBtnEmoji}>{emoji}</Text>
                  <Text style={[styles.tipoBtnText, tipo === valor && styles.tipoBtnTextAtivo]}>
                    {desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {tipo === 'hard' && (
              <Text style={styles.tipoInfo}>
                🔒 Hard Blocks não são deslocados pelo efeito cascata.
              </Text>
            )}
          </View>

          {/* Carga cognitiva */}
          <View style={styles.secao}>
            <Text style={styles.secaoLabel}>Carga Cognitiva</Text>
            <View style={styles.cargaRow}>
              {([
                { valor: 'baixa', label: 'Baixa', cor: '#00B894' },
                { valor: 'media', label: 'Média', cor: '#FFD93D' },
                { valor: 'alta', label: 'Alta', cor: '#FF6B6B' },
              ] as { valor: CargaCognitiva; label: string; cor: string }[]).map(({ valor, label, cor: c }) => (
                <TouchableOpacity
                  key={valor}
                  style={[
                    styles.cargaBtn,
                    carga === valor && { borderColor: c, backgroundColor: c + '18' },
                  ]}
                  onPress={() => setCarga(valor)}
                >
                  <View style={[styles.cargaDot, { backgroundColor: c }]} />
                  <Text style={[styles.cargaBtnText, carga === valor && { color: c }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preview cognitivo */}
          <PreviewCognitivo
            inicioMinutos={inicioMinutos}
            cargaCognitiva={carga}
            duracaoMinutos={duracao}
            titulo={titulo || 'Nova atividade'}
          />

          {/* Cor */}
          <View style={styles.secao}>
            <Text style={styles.secaoLabel}>Cor</Text>
            <View style={styles.coresGrid}>
              {CORES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.corBtn,
                    { backgroundColor: c },
                    cor === c && styles.corBtnAtivo,
                  ]}
                  onPress={() => setCor(c)}
                >
                  {cor === c && <Text style={styles.corCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Excluir */}
          {blocoExistente && blocoExistente.tipo !== 'sono' && (
            <TouchableOpacity style={styles.excluirBtn} onPress={handleExcluir}>
              <Text style={styles.excluirBtnText}>🗑 Excluir bloco</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Alias para compatibilidade com nome no handleSalvar
const podeСалvar = true; // Placeholder — calculado inline no componente

// ─────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },

  // ── Header ───────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A30',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F0F0FF',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#8888AA',
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipBtnText: {
    fontSize: 13,
    color: '#4ECDC4',
  },
  saveBtn: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  saveBtnDisabled: {
    backgroundColor: '#1A1A30',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D0D1A',
  },

  // ── Presets ───────────────────────────────────
  presetGrid: {
    padding: 20,
  },
  presetSectionTitle: {
    fontSize: 11,
    color: '#555577',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetCard: {
    width: (SCREEN_WIDTH - 60) / 3,
    backgroundColor: '#111122',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'flex-start',
    gap: 6,
  },
  presetIconeWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetIcone: { fontSize: 18 },
  presetCardTitulo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D0D0EE',
    lineHeight: 16,
  },
  presetCardMeta: { fontSize: 10, color: '#666688' },
  presetCorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  presetDivider: {
    height: 1,
    backgroundColor: '#1A1A30',
    marginVertical: 20,
  },
  presetCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#111122',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222244',
    borderStyle: 'dashed',
    padding: 16,
  },
  presetCustomIcone: {
    fontSize: 24,
    color: '#4ECDC4',
    width: 40,
    textAlign: 'center',
  },
  presetCustomTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D0D0EE',
  },
  presetCustomSub: {
    fontSize: 12,
    color: '#666688',
    marginTop: 2,
  },

  // ── Formulário ────────────────────────────────
  formContent: {
    padding: 20,
  },
  tituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconePicker: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#161628',
    borderWidth: 1,
    borderColor: '#222244',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconePickerEmoji: { fontSize: 24 },
  tituloInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#F0F0FF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#222244',
    paddingBottom: 8,
    letterSpacing: -0.3,
  },

  iconesScroll: { marginBottom: 24 },
  iconesContent: { gap: 6, paddingVertical: 4 },
  iconeBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#111122',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E36',
  },
  iconeBtnAtivo: {
    borderColor: '#4ECDC4',
    backgroundColor: '#4ECDC420',
  },
  iconeBtnEmoji: { fontSize: 18 },

  // ── Horários ──────────────────────────────────
  secao: { marginBottom: 24 },
  secaoLabel: {
    fontSize: 11,
    color: '#666688',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  horarioRow: {
    flexDirection: 'row',
    backgroundColor: '#111122',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E36',
    padding: 16,
    alignItems: 'center',
  },
  horarioDivisor: {
    width: 1,
    height: 40,
    backgroundColor: '#1E1E36',
    marginHorizontal: 16,
  },
  horarioFim: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8888AA',
    letterSpacing: -1,
  },

  // ── Tipo ──────────────────────────────────────
  tipoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tipoBtn: {
    flex: 1,
    backgroundColor: '#111122',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E36',
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  tipoBtnAtivo: {
    borderColor: '#4ECDC4',
    backgroundColor: '#4ECDC415',
  },
  tipoBtnEmoji: { fontSize: 18 },
  tipoBtnText: { fontSize: 11, color: '#666688', fontWeight: '500' },
  tipoBtnTextAtivo: { color: '#4ECDC4' },
  tipoInfo: {
    fontSize: 11,
    color: '#FF6B6B',
    marginTop: 8,
    paddingLeft: 2,
  },

  // ── Carga cognitiva ───────────────────────────
  cargaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cargaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111122',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E1E36',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  cargaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cargaBtnText: {
    fontSize: 12,
    color: '#666688',
    fontWeight: '500',
  },

  // ── Cores ─────────────────────────────────────
  coresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  corBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corBtnAtivo: {
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  corCheck: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },

  // ── Excluir ───────────────────────────────────
  excluirBtn: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FF6B6B12',
    borderWidth: 1,
    borderColor: '#FF6B6B30',
    alignItems: 'center',
  },
  excluirBtnText: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '600',
  },
});
