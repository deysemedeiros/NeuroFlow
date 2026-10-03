import { useRouter } from "expo-router";
import { Check, Pause, Play, RefreshCw, Volume2, VolumeX, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WaveBackground } from "@/components/WaveBackground";
import { useColors } from "@/hooks/useColors";

const TOTAL = 120;

type Phase = "Inspire" | "Segure" | "Expire";

const CYCLE: { phase: Phase; duration: number }[] = [
  { phase: "Inspire", duration: 4 },
  { phase: "Segure", duration: 4 },
  { phase: "Expire", duration: 6 },
];

const MESSAGES = [
  "Você está segura aqui",
  "Um passo de cada vez",
  "Respire com calma",
  "Seu ritmo é suficiente",
  "Está tudo bem desacelerar",
  "Você não precisa dar conta de tudo agora",
  "Inspire leveza, expire tensão",
  "Seu corpo pode relaxar",
  "Volte para o momento presente",
  "Acalme sua mente com gentileza",
];

const MESSAGE_INTERVAL = 6000;

function useAmbientSound(enabled: boolean) {
  const ctxRef = useRef<unknown>(null);
  const nodesRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!enabled) {
      nodesRef.current?.stop();
      nodesRef.current = null;
      return;
    }
    try {
      const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const Ctor = W.AudioContext || W.webkitAudioContext;
      if (!Ctor) return;
      const ctx = (ctxRef.current as AudioContext) || new Ctor();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();

      const master = ctx.createGain();
      master.gain.value = 0;
      master.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.5);
      master.connect(ctx.destination);

      const make = (freq: number, gain: number) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.value = gain;
        osc.connect(g);
        g.connect(master);
        osc.start();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.1 + Math.random() * 0.1;
        lfoGain.gain.value = freq * 0.004;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();
        return [osc, lfo];
      };

      const a = make(196, 0.5);
      const b = make(261.63, 0.4);
      const c = make(329.63, 0.3);

      nodesRef.current = {
        stop: () => {
          try {
            master.gain.cancelScheduledValues(ctx.currentTime);
            master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
            setTimeout(() => {
              [...a, ...b, ...c].forEach((n) => { try { (n as OscillatorNode).stop(); } catch {} });
            }, 700);
          } catch {}
        },
      };
    } catch {}

    return () => { nodesRef.current?.stop(); nodesRef.current = null; };
  }, [enabled]);
}

export default function RespirarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [running, setRunning] = useState(true);
  const [remaining, setRemaining] = useState(TOTAL);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseTime, setPhaseTime] = useState(CYCLE[0].duration);
  const [messageIdx, setMessageIdx] = useState(() => Math.floor(Math.random() * MESSAGES.length));
  const [soundOn, setSoundOn] = useState(false);

  useAmbientSound(soundOn && running);

  const scale = useRef(new Animated.Value(0.8)).current;
  const glow = useRef(new Animated.Value(0.5)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const phaseFade = useRef(new Animated.Value(1)).current;
  const messageFade = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const rippleRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    rippleRef.current = Animated.loop(Animated.timing(ripple, { toValue: 1, duration: 4000, easing: Easing.out(Easing.cubic), useNativeDriver: true }));
    rippleRef.current.start();
    return () => rippleRef.current?.stop();
  }, [ripple]);

  useEffect(() => {
    if (!running) { animationRef.current?.stop(); return; }
    const phase = CYCLE[phaseIdx];
    let toScale = 0.8, toGlow = 0.4;
    if (phase.phase === "Inspire" || phase.phase === "Segure") { toScale = 1.25; toGlow = 0.9; }

    Animated.sequence([
      Animated.timing(phaseFade, { toValue: 0.3, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(phaseFade, { toValue: 1, duration: 360, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();

    animationRef.current = Animated.parallel([
      Animated.timing(scale, { toValue: toScale, duration: phase.duration * 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(glow, { toValue: toGlow, duration: phase.duration * 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]);
    animationRef.current.start();
  }, [phaseIdx, running, scale, glow, phaseFade]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1));
      setPhaseTime((pt) => {
        if (pt <= 1) { setPhaseIdx((i) => (i + 1) % CYCLE.length); return CYCLE[(phaseIdx + 1) % CYCLE.length].duration; }
        return pt - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, phaseIdx]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      Animated.timing(messageFade, { toValue: 0, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
        setMessageIdx((i) => (i + 1) % MESSAGES.length);
        Animated.timing(messageFade, { toValue: 1, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
      });
    }, MESSAGE_INTERVAL);
    return () => clearInterval(t);
  }, [running, messageFade]);

  useEffect(() => { if (remaining === 0) setRunning(false); }, [remaining]);

  const reset = () => {
    setRemaining(TOTAL);
    setPhaseIdx(0);
    setPhaseTime(CYCLE[0].duration);
    setRunning(true);
    scale.setValue(0.8);
    glow.setValue(0.4);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const phase = CYCLE[phaseIdx].phase;
  const progress = ((TOTAL - remaining) / TOTAL) * 100;
  const rippleScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.6] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.18, 0] });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <WaveBackground />

      <View style={[styles.header, { paddingTop: insets.top + 12, paddingHorizontal: 22 }]}>
        <Pressable
          onPress={() => setSoundOn((s) => !s)}
          style={({ pressed }) => [styles.soundToggle, { backgroundColor: soundOn ? colors.softPurple : colors.card, opacity: pressed ? 0.85 : 1 }]}
        >
          {soundOn ? (
            <Volume2 size={16} color="#fff" strokeWidth={1.8} />
          ) : (
            <VolumeX size={16} color={colors.foreground} strokeWidth={1.8} />
          )}
          <Text style={[styles.soundLabel, { color: soundOn ? "#fff" : colors.foreground }]}>
            Som ambiente
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}
        >
          <X size={20} color={colors.foreground} strokeWidth={1.8} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={{ alignItems: "center", paddingHorizontal: 28 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Respire por 2 minutos</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Acalme sua mente, antes de começar</Text>
        </View>

        <View style={styles.orbWrap}>
          <Animated.View style={[styles.ripple, { backgroundColor: colors.lilac, transform: [{ scale: rippleScale }], opacity: rippleOpacity }]} />
          <Animated.View style={[styles.glow, { backgroundColor: colors.softPurple, opacity: glow, transform: [{ scale: scale }] }]} />
          <Animated.View style={[styles.orb, { backgroundColor: colors.card, transform: [{ scale: scale }], shadowColor: colors.softPurple }]}>
            <Animated.Text style={[styles.phaseText, { color: colors.softPurple, opacity: phaseFade }]}>{phase}</Animated.Text>
            <Text style={[styles.phaseTime, { color: colors.mutedForeground }]}>{phaseTime}s</Text>
          </Animated.View>
        </View>

        <View style={styles.messageWrap}>
          <Animated.Text style={[styles.message, { color: colors.mutedForeground, opacity: messageFade }]}>
            {MESSAGES[messageIdx]}
          </Animated.Text>
        </View>

        <View style={styles.bottomArea}>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.softPurple, width: `${progress}%` }]} />
          </View>
          <Text style={[styles.timer, { color: colors.foreground }]}>{formatTime(remaining)}</Text>

          <View style={styles.controls}>
            <Pressable onPress={reset} style={({ pressed }) => [styles.controlBtn, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}>
              <RefreshCw size={20} color={colors.foreground} strokeWidth={1.8} />
            </Pressable>

            <Pressable
              onPress={() => setRunning((r) => !r)}
              style={({ pressed }) => [styles.playBtn, { backgroundColor: colors.softPurple, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              {running ? (
                <Pause size={26} color="#fff" strokeWidth={1.8} />
              ) : (
                <Play size={26} color="#fff" strokeWidth={1.8} />
              )}
            </Pressable>

            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.controlBtn, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}>
              <Check size={20} color={colors.foreground} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  soundToggle: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, height: 40, borderRadius: 999, shadowColor: "#7C6AAE", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  soundLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  closeBtn: { width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center", shadowColor: "#7C6AAE", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  content: { flex: 1, justifyContent: "space-between", paddingBottom: 50, paddingTop: 12 },
  title: { fontSize: 22, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 6 },
  orbWrap: { alignItems: "center", justifyContent: "center", height: 300 },
  ripple: { position: "absolute", width: 260, height: 260, borderRadius: 999 },
  glow: { position: "absolute", width: 220, height: 220, borderRadius: 999 },
  orb: { width: 200, height: 200, borderRadius: 999, alignItems: "center", justifyContent: "center", shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
  phaseText: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  phaseTime: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 4 },
  messageWrap: { minHeight: 48, paddingHorizontal: 36, alignItems: "center", justifyContent: "center" },
  message: { fontSize: 16, fontFamily: "Inter_400Regular", fontStyle: "italic", textAlign: "center", lineHeight: 24, letterSpacing: 0.1 },
  bottomArea: { paddingHorizontal: 32, alignItems: "center" },
  progressTrack: { height: 6, width: "100%", borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  timer: { fontSize: 32, fontFamily: "Inter_700Bold", marginTop: 14, letterSpacing: 1 },
  controls: { flexDirection: "row", alignItems: "center", gap: 24, marginTop: 24 },
  controlBtn: { width: 52, height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center", shadowColor: "#7C6AAE", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  playBtn: { width: 72, height: 72, borderRadius: 999, alignItems: "center", justifyContent: "center", shadowColor: "#7C6AAE", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
});
