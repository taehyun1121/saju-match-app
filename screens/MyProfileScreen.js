import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '../config';

const OHAENG_COLOR = {
  '木': '#4ade80', '화': '#f87171', '火': '#f87171',
  '土': '#fbbf24', '금': '#c0c8d4', '金': '#c0c8d4',
  '水': '#60a5fa',
};

const PILLAR_LABELS = ['년주', '월주', '일주', '시주'];

// 오행 한글명
const OHAENG_NAMES = { '木': '목', '火': '화', '土': '토', '金': '금', '水': '수' };
const OHAENG_ORDER = ['木', '火', '土', '金', '水'];

function PillarCard({ label, top, bottom }) {
  return (
    <View style={s.pillarCard}>
      <Text style={s.pillarLabel}>{label}</Text>
      <Text style={s.pillarTop}>{top || '?'}</Text>
      <View style={s.pillarDivider} />
      <Text style={s.pillarBottom}>{bottom || '?'}</Text>
    </View>
  );
}

function OhaengBar({ ohaeng }) {
  // ohaeng: { 木: 2, 火: 1, ... } 형태 또는 배열
  const total = Object.values(ohaeng).reduce((a, b) => a + b, 0) || 1;
  return (
    <View style={s.ohaengContainer}>
      {OHAENG_ORDER.map((key) => {
        const count = ohaeng[key] || 0;
        const pct = Math.round((count / total) * 100);
        const color = OHAENG_COLOR[key] || '#a78bfa';
        return (
          <View key={key} style={s.ohaengRow}>
            <Text style={[s.ohaengKey, { color }]}>{OHAENG_NAMES[key] || key}</Text>
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={s.ohaengCount}>{count}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function MyProfileScreen({ navigation, route }) {
  const { userInfo, sajuResult: initialResult } = route.params || {};

  const [sajuResult, setSajuResult] = useState(initialResult || null);
  const [loading, setLoading] = useState(!initialResult && !!userInfo);
  const [error, setError] = useState('');

  // userInfo만 넘어온 경우 API 직접 호출
  useEffect(() => {
    if (!initialResult && userInfo) {
      fetchSaju();
    }
  }, []);

  async function fetchSaju() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/saju`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person: {
            year: userInfo.year,
            month: userInfo.month,
            day: userInfo.day,
            hour: userInfo.hour,
            gender: userInfo.gender,
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSajuResult(data);
    } catch (e) {
      setError('사주 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (!userInfo) {
    return (
      <SafeAreaView style={s.container}>
        <Text style={s.empty}>사주 정보가 없습니다.</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.navigate('Onboarding')}>
          <Text style={s.backText}>← 다시 입력</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const name = userInfo.name || '';
  const gender = userInfo.gender === 'male' ? '남성' : '여성';
  const birth = `${userInfo.year}.${String(userInfo.month).padStart(2, '0')}.${String(userInfo.day).padStart(2, '0')}${userInfo.hour !== null && userInfo.hour !== undefined ? ` ${userInfo.hour}시` : ''}`;

  // 사주 4주 — API pillars: { yeonju, wolju, ilju, siju } 각 { gan, ji }
  const p = sajuResult?.pillars;
  const pillars = p ? [
    { hanja: p.yeonju?.gan || '?', hangul: p.yeonju?.ji || '?' },
    { hanja: p.wolju?.gan  || '?', hangul: p.wolju?.ji  || '?' },
    { hanja: p.ilju?.gan   || '?', hangul: p.ilju?.ji   || '?' },
    { hanja: p.siju?.gan   || '-', hangul: p.siju?.ji   || '시간 모름' },
  ] : [
    { hanja: '-', hangul: sajuResult?.yeonji || '?' },
    { hanja: '-', hangul: '-' },
    { hanja: sajuResult?.ilgan || '?', hangul: sajuResult?.ilji || '?' },
    { hanja: '-', hangul: '-' },
  ];

  // 오행 분포 — API ohaeng.counts: { 木, 火, 土, 金, 水 }
  const ohaeng = sajuResult?.ohaeng?.counts || sajuResult?.ohaeng || {};
  const lacking = sajuResult?.ohaeng?.lacking || [];
  const hasOhaeng = Object.keys(ohaeng).length > 0;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>내 사주</Text>

        {/* 프로필 카드 */}
        <View style={s.profileCard}>
          <Text style={s.profileName}>{name}</Text>
          <Text style={s.profileSub}>{birth} · {gender}</Text>
        </View>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color="#a78bfa" size="large" />
            <Text style={s.loadingText}>사주를 분석 중...</Text>
          </View>
        ) : error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={fetchSaju}>
              <Text style={s.retryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* 4주 */}
            <Text style={s.sectionLabel}>사주 원국 (四柱)</Text>
            <View style={s.pillarsRow}>
              {PILLAR_LABELS.map((lbl, i) => (
                <PillarCard
                  key={lbl}
                  label={lbl}
                  top={pillars[i]?.hanja || pillars[i]?.top || '?'}
                  bottom={pillars[i]?.hangul || pillars[i]?.bottom || '?'}
                />
              ))}
            </View>

            {/* 오행 분포 */}
            {hasOhaeng && (
              <>
                <Text style={s.sectionLabel}>오행 분포 (五行)</Text>
                <View style={s.card}>
                  <OhaengBar ohaeng={ohaeng} />
                  {lacking.length > 0 && (
                    <View style={s.lackingBox}>
                      <Text style={s.lackingLabel}>부족한 오행</Text>
                      <View style={s.lackingRow}>
                        {lacking.map((oh) => (
                          <View key={oh} style={[s.lackingBadge, { borderColor: OHAENG_COLOR[oh] || '#a78bfa' }]}>
                            <Text style={[s.lackingText, { color: OHAENG_COLOR[oh] || '#a78bfa' }]}>{oh}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={s.lackingHint}>보완이 필요한 기운이에요</Text>
                    </View>
                  )}
                  {lacking.length === 0 && hasOhaeng && (
                    <Text style={s.balancedText}>✦ 오행이 균형 잡혀 있어요</Text>
                  )}
                </View>
              </>
            )}

            {/* 기타 설명 */}
            {!!sajuResult?.description && (
              <>
                <Text style={s.sectionLabel}>해석</Text>
                <View style={s.card}>
                  <Text style={s.descText}>{sajuResult.description}</Text>
                </View>
              </>
            )}
          </>
        )}

        {/* 매칭 찾기 */}
        <TouchableOpacity
          style={[s.primaryBtn, (loading || !!error) && s.primaryBtnOff]}
          onPress={() => navigation.navigate('매칭', { userInfo, sajuResult })}
          disabled={loading || !!error}
        >
          <Text style={s.primaryBtnText}>궁합 맞는 상대 찾기 →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.ghostBtn} onPress={() => navigation.navigate('Onboarding')}>
          <Text style={s.ghostBtnText}>← 정보 수정</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  scroll: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#a78bfa', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 60, fontSize: 16 },
  profileCard: {
    backgroundColor: '#1a1a2e', borderRadius: 16, padding: 22,
    borderWidth: 1, borderColor: '#2d2d4e', alignItems: 'center', marginBottom: 28,
  },
  profileName: { fontSize: 22, fontWeight: '700', color: '#e2e8f0', marginBottom: 6 },
  profileSub: { fontSize: 13, color: '#94a3b8' },
  sectionLabel: { fontSize: 11, color: '#6b6b8e', letterSpacing: 1.2, marginBottom: 12, marginTop: 4 },
  pillarsRow: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  pillarCard: {
    flex: 1, minWidth: 68, backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#2d2d4e',
  },
  pillarLabel: { fontSize: 10, color: '#6b6b8e', marginBottom: 10 },
  pillarTop: { fontSize: 26, fontWeight: '700', color: '#a78bfa', marginBottom: 6 },
  pillarDivider: { width: 28, height: 1, backgroundColor: '#2d2d4e', marginBottom: 6 },
  pillarBottom: { fontSize: 22, fontWeight: '600', color: '#c4b5fd' },
  card: {
    backgroundColor: '#1a1a2e', borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: '#2d2d4e', marginBottom: 24,
  },
  ohaengContainer: { gap: 10 },
  ohaengRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ohaengKey: { fontSize: 14, fontWeight: '700', width: 20, textAlign: 'center' },
  barBg: { flex: 1, height: 8, backgroundColor: '#2d2d4e', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  ohaengCount: { fontSize: 12, color: '#94a3b8', width: 16, textAlign: 'right' },
  descText: { color: '#c4b5fd', fontSize: 14, lineHeight: 22 },
  lackingBox: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2d2d4e' },
  lackingLabel: { fontSize: 11, color: '#6b6b8e', marginBottom: 8 },
  lackingRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
  lackingBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, backgroundColor: '#0d0d1a' },
  lackingText: { fontSize: 14, fontWeight: '700' },
  lackingHint: { fontSize: 12, color: '#6b6b8e', marginTop: 2 },
  balancedText: { fontSize: 13, color: '#4ade80', textAlign: 'center', marginTop: 12 },
  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 14 },
  loadingText: { color: '#94a3b8', fontSize: 14 },
  errorBox: { alignItems: 'center', paddingVertical: 30, gap: 16 },
  errorText: { color: '#f87171', fontSize: 14, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#2d2d4e', borderRadius: 10 },
  retryText: { color: '#a78bfa', fontSize: 14 },
  primaryBtn: {
    backgroundColor: '#7c3aed', borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginBottom: 12, marginTop: 8,
  },
  primaryBtnOff: { opacity: 0.4 },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  ghostBtn: { alignItems: 'center', paddingVertical: 12 },
  ghostBtnText: { color: '#6b6b8e', fontSize: 14 },
  backBtn: { alignItems: 'center', marginTop: 20 },
  backText: { color: '#a78bfa', fontSize: 15 },
});
