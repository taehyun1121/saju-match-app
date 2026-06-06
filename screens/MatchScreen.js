import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  AppState, Animated, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const MOCK_MATCHES = [
  { id: 1, distance: 120,  score: 91, grade: 'S', label: '운명적 궁합' },
  { id: 2, distance: 350,  score: 74, grade: 'A', label: '잘 맞는 인연' },
  { id: 3, distance: 80,   score: 58, grade: 'B', label: '노력하면 좋은 관계' },
  { id: 4, distance: 620,  score: 88, grade: 'S', label: '운명적 궁합' },
  { id: 5, distance: 210,  score: 45, grade: 'C', label: '성장형 궁합' },
];

const GRADE_COLOR = { S: '#f59e0b', A: '#a78bfa', B: '#60a5fa', C: '#4ade80', D: '#f87171' };
const NOTIFY_MIN_SCORE = 70;

async function setupNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('match', {
      name: '매칭 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 200, 200],
    });
  }
  return true;
}

async function pushNotification(match) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '근처에 궁합 좋은 분이 있어요',
      body: `${match.distance}m · ${match.score}점 (${match.grade}) — ${match.label}`,
      channelId: 'match',
    },
    trigger: null,
  });
}

// ── 인앱 배너 ────────────────────────────────────────────────────────────────

function InAppBanner({ match, onDismiss }) {
  const slideY = useRef(new Animated.Value(-110)).current;

  useEffect(() => {
    Animated.spring(slideY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }).start();
    const t = setTimeout(dismiss, 4500);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    Animated.timing(slideY, { toValue: -110, duration: 260, useNativeDriver: true }).start(onDismiss);
  }

  const color = GRADE_COLOR[match.grade] || '#a78bfa';

  return (
    <Animated.View style={[bs.banner, { transform: [{ translateY: slideY }] }]}>
      <TouchableOpacity onPress={dismiss} activeOpacity={0.92} style={bs.inner}>
        <View style={[bs.grade, { borderColor: color }]}>
          <Text style={[bs.gradeText, { color }]}>{match.grade}</Text>
        </View>
        <View style={bs.body}>
          <Text style={bs.title}>{match.distance}m 거리에 인연이 있어요</Text>
          <Text style={bs.sub}>{match.score}점 · {match.label}</Text>
        </View>
        <Text style={bs.close}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const bs = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 4,
  },
  inner: {
    backgroundColor: '#1e1535', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#a78bfa',
    shadowColor: '#a78bfa', shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  grade: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: 18, fontWeight: '800' },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#e2e8f0', marginBottom: 2 },
  sub: { fontSize: 12, color: '#94a3b8' },
  close: { fontSize: 14, color: '#6b6b8e', paddingLeft: 4 },
});

// ── 매치 카드 ─────────────────────────────────────────────────────────────────

function MatchCard({ match }) {
  const color = GRADE_COLOR[match.grade] || '#a78bfa';
  const pct = match.score;
  return (
    <View style={s.card}>
      <View style={[s.cardGrade, { borderColor: color }]}>
        <Text style={[s.cardGradeText, { color }]}>{match.grade}</Text>
      </View>
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <Text style={s.cardDistance}>{match.distance}m</Text>
          <Text style={[s.cardScore, { color }]}>{match.score}점</Text>
        </View>
        <Text style={s.cardLabel}>{match.label}</Text>
        <View style={s.barTrack}>
          <View style={[s.barFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────────────────────────

export default function MatchScreen() {
  const [locStatus, setLocStatus] = useState(null); // null | 'granted' | 'denied'
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [matches, setMatches] = useState([]);
  const [banner, setBanner] = useState(null);

  const appStateRef = useRef(AppState.currentState);
  const timerRef = useRef(null);
  const idxRef = useRef(0);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      appStateRef.current = state;
    });
    return () => { sub.remove(); clearInterval(timerRef.current); };
  }, []);

  async function handleRequestPermissions() {
    const locRes = await Location.requestForegroundPermissionsAsync();
    setLocStatus(locRes.status);

    const notifOk = await setupNotifications();
    setNotifEnabled(notifOk);

    if (locRes.status === 'granted') startScan();
  }

  function startScan() {
    setScanning(true);
    setMatches([]);
    idxRef.current = 0;
    triggerMockMatch();
    timerRef.current = setInterval(triggerMockMatch, 10000);
  }

  function stopScan() {
    setScanning(false);
    clearInterval(timerRef.current);
  }

  function triggerMockMatch() {
    const match = MOCK_MATCHES[idxRef.current % MOCK_MATCHES.length];
    idxRef.current += 1;

    setMatches((prev) => prev.find((m) => m.id === match.id) ? prev : [match, ...prev]);

    if (match.score < NOTIFY_MIN_SCORE) return;

    if (appStateRef.current === 'active') {
      setBanner(match);
    } else {
      pushNotification(match);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      {banner && <InAppBanner match={banner} onDismiss={() => setBanner(null)} />}

      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>사주 매칭</Text>
        <Text style={s.subtitle}>주변의 궁합 좋은 인연을 찾아드려요</Text>

        {/* 권한 요청 */}
        {locStatus === null && (
          <View style={s.permCard}>
            <Text style={s.permEmoji}>📍</Text>
            <Text style={s.permTitle}>위치 권한이 필요해요</Text>
            <Text style={s.permDesc}>
              근처의 인연을 찾으려면 위치 접근 권한을 허용해주세요.{'\n'}
              알림 권한도 함께 요청됩니다.
            </Text>
            <TouchableOpacity style={s.permBtn} onPress={handleRequestPermissions}>
              <Text style={s.permBtnText}>권한 허용하기 →</Text>
            </TouchableOpacity>
          </View>
        )}

        {locStatus === 'denied' && (
          <View style={s.permCard}>
            <Text style={s.permEmoji}>⚠️</Text>
            <Text style={s.permTitle}>위치 권한이 거부되었어요</Text>
            <Text style={s.permDesc}>기기 설정에서 위치 권한을 허용해주세요.</Text>
          </View>
        )}

        {/* 스캔 컨트롤 */}
        {locStatus === 'granted' && (
          <>
            <View style={s.scanCard}>
              <View style={s.scanLeft}>
                {scanning
                  ? <ActivityIndicator color="#a78bfa" size="small" style={{ marginRight: 10 }} />
                  : <View style={s.dotOff} />}
                <Text style={s.scanText}>{scanning ? '탐색 중...' : '탐색 중지됨'}</Text>
              </View>
              <TouchableOpacity
                style={[s.scanBtn, scanning && s.scanBtnStop]}
                onPress={scanning ? stopScan : startScan}
              >
                <Text style={s.scanBtnText}>{scanning ? '중지' : '시작'}</Text>
              </TouchableOpacity>
            </View>

            {!notifEnabled && (
              <View style={s.warnRow}>
                <Text style={s.warnText}>
                  알림 권한이 없어 백그라운드 알림이 비활성화됩니다.
                </Text>
              </View>
            )}

            {/* 매치 결과 */}
            {matches.length > 0 ? (
              <>
                <Text style={s.sectionLabel}>탐지된 인연 {matches.length}명</Text>
                {matches.map((m) => <MatchCard key={m.id} match={m} />)}
              </>
            ) : scanning ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyEmoji}>🔮</Text>
                <Text style={s.emptyText}>탐색 중입니다</Text>
                <Text style={s.emptyDesc}>잠시만 기다려주세요</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  scroll: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#a78bfa', textAlign: 'center', marginTop: 8, marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 32 },
  // 권한 카드
  permCard: {
    backgroundColor: '#1a1a2e', borderRadius: 20, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: '#2d2d4e',
  },
  permEmoji: { fontSize: 40, marginBottom: 14 },
  permTitle: { fontSize: 17, fontWeight: '700', color: '#e2e8f0', marginBottom: 10 },
  permDesc: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  permBtn: {
    backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28,
  },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  // 스캔 카드
  scanCard: {
    backgroundColor: '#1a1a2e', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#2d2d4e', marginBottom: 12,
  },
  scanLeft: { flexDirection: 'row', alignItems: 'center' },
  dotOff: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4a4a6a', marginRight: 10 },
  scanText: { color: '#94a3b8', fontSize: 14 },
  scanBtn: {
    backgroundColor: '#7c3aed', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  scanBtnStop: { backgroundColor: '#3b1f5e' },
  scanBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  // 경고
  warnRow: {
    backgroundColor: '#2e1a00', borderRadius: 10, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#7c4a00',
  },
  warnText: { color: '#fbbf24', fontSize: 12 },
  // 섹션
  sectionLabel: { fontSize: 11, color: '#6b6b8e', letterSpacing: 1.2, marginBottom: 10, marginTop: 8 },
  // 매치 카드
  card: {
    backgroundColor: '#1a1a2e', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: '#2d2d4e', marginBottom: 10,
  },
  cardGrade: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  cardGradeText: { fontSize: 18, fontWeight: '800' },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardDistance: { fontSize: 15, color: '#e2e8f0', fontWeight: '600' },
  cardScore: { fontSize: 15, fontWeight: '700' },
  cardLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  barTrack: { height: 4, backgroundColor: '#2d2d4e', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  // 빈 상태
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 40, marginBottom: 14 },
  emptyText: { fontSize: 16, color: '#6b6b8e', fontWeight: '600', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#4a4a6a' },
});
