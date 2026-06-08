import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const OHAENG_COLOR = { '木': '#4ade80', '火': '#f87171', '土': '#fbbf24', '金': '#c0c8d4', '水': '#60a5fa' };
const OHAENG_LABEL = { '木': '목(木)', '火': '화(火)', '土': '토(土)', '金': '금(金)', '水': '수(水)' };
const OHAENG_DESC = {
  '木': '창의적이고 진취적인 기운',
  '火': '열정적이고 표현력 강한 기운',
  '土': '안정적이고 신뢰감 있는 기운',
  '金': '의지력과 결단력이 강한 기운',
  '水': '지혜롭고 유연한 기운',
};

// 오행별 잘 맞는 천간·지지
const OHAENG_CHARS = {
  '木': { gan: ['갑', '을'], ji: ['인', '묘'] },
  '火': { gan: ['병', '정'], ji: ['사', '오'] },
  '土': { gan: ['무', '기'], ji: ['진', '술', '축', '미'] },
  '金': { gan: ['경', '신'], ji: ['신', '유'] },
  '水': { gan: ['임', '계'], ji: ['자', '해'] },
};

// 목업 프로필 데이터 (실제 서비스엔 DB 연동)
const MOCK_PROFILES = [
  { id: 1, name: '이○○', age: 28, gender: '여성', ilgan: '갑', ilji: '자', yeonji: '인', dominant: '木', score: 88, grade: 'S' },
  { id: 2, name: '박○○', age: 31, gender: '남성', ilgan: '임', ilji: '신', yeonji: '해', dominant: '水', score: 82, grade: 'A' },
  { id: 3, name: '김○○', age: 26, gender: '여성', ilgan: '을', ilji: '묘', yeonji: '묘', dominant: '木', score: 79, grade: 'A' },
  { id: 4, name: '최○○', age: 33, gender: '남성', ilgan: '무', ilji: '술', yeonji: '토', dominant: '土', score: 71, grade: 'A' },
  { id: 5, name: '정○○', age: 29, gender: '여성', ilgan: '계', ilji: '해', yeonji: '자', dominant: '水', score: 85, grade: 'S' },
  { id: 6, name: '장○○', age: 27, gender: '남성', ilgan: '경', ilji: '유', yeonji: '신', dominant: '金', score: 65, grade: 'B' },
  { id: 7, name: '윤○○', age: 30, gender: '여성', ilgan: '병', ilji: '오', yeonji: '사', dominant: '火', score: 58, grade: 'B' },
  { id: 8, name: '한○○', age: 32, gender: '남성', ilgan: '기', ilji: '미', yeonji: '축', dominant: '土', score: 61, grade: 'B' },
];

const GRADE_COLOR = { S: '#f59e0b', A: '#a78bfa', B: '#60a5fa', C: '#4ade80', D: '#f87171' };

function filterProfiles(lacking, dominant) {
  if (!lacking || lacking.length === 0) return MOCK_PROFILES.sort((a, b) => b.score - a.score);
  return MOCK_PROFILES
    .map((p) => {
      let boost = 0;
      if (lacking.includes(p.dominant)) boost += 15;
      const chars = OHAENG_CHARS[p.dominant] || {};
      if (chars.gan?.includes(p.ilgan)) boost += 5;
      return { ...p, score: Math.min(99, p.score + boost) };
    })
    .sort((a, b) => b.score - a.score);
}

function ConditionCard({ oh }) {
  const color = OHAENG_COLOR[oh] || '#a78bfa';
  const chars = OHAENG_CHARS[oh] || {};
  return (
    <View style={[s.condCard, { borderColor: color }]}>
      <Text style={[s.condOh, { color }]}>{OHAENG_LABEL[oh]}</Text>
      <Text style={s.condDesc}>{OHAENG_DESC[oh]}</Text>
      <Text style={s.condChars}>
        천간: {chars.gan?.join(' · ')}  |  지지: {chars.ji?.join(' · ')}
      </Text>
    </View>
  );
}

function ProfileCard({ profile, lacking }) {
  const color = GRADE_COLOR[profile.grade] || '#a78bfa';
  const isMatch = lacking?.includes(profile.dominant);
  return (
    <View style={[s.profileCard, isMatch && s.profileCardHighlight]}>
      <View style={s.profileLeft}>
        {isMatch && <View style={[s.matchDot, { backgroundColor: OHAENG_COLOR[profile.dominant] || '#a78bfa' }]} />}
        <Text style={s.profileName}>{profile.name}</Text>
        <Text style={s.profileSub}>{profile.age}세 · {profile.gender}</Text>
        <Text style={s.profilePillar}>일주: {profile.ilgan}{profile.ilji}</Text>
      </View>
      <View style={s.profileRight}>
        <View style={[s.gradeCircle, { borderColor: color }]}>
          <Text style={[s.gradeText, { color }]}>{profile.grade}</Text>
        </View>
        <Text style={[s.scoreText, { color }]}>{profile.score}점</Text>
        {isMatch && (
          <View style={[s.matchBadge, { borderColor: OHAENG_COLOR[profile.dominant] }]}>
            <Text style={[s.matchBadgeText, { color: OHAENG_COLOR[profile.dominant] }]}>
              {profile.dominant} 보완
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function MatchScreen({ route, navigation }) {
  const { userInfo, sajuResult } = route.params || {};
  const lacking = sajuResult?.ohaeng?.lacking || [];
  const dominant = sajuResult?.ohaeng?.dominant || '';
  const profiles = filterProfiles(lacking, dominant);
  const [showAll, setShowAll] = useState(false);
  const displayProfiles = showAll ? profiles : profiles.slice(0, 5);

  if (!userInfo || !sajuResult) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.emptyBox}>
          <Text style={s.emptyEmoji}>☯</Text>
          <Text style={s.emptyText}>먼저 내 사주를 입력해주세요</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('사주')}>
            <Text style={s.emptyBtnText}>사주 입력하러 가기 →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>사주 매칭</Text>

        {/* 내 사주 요약 */}
        <View style={s.myCard}>
          <Text style={s.myLabel}>내 사주</Text>
          <Text style={s.myName}>{userInfo.name}</Text>
          <Text style={s.myPillar}>
            일주: {sajuResult?.pillars?.ilju?.gan}{sajuResult?.pillars?.ilju?.ji}
            {dominant ? `  ·  주요 오행: ${dominant}` : ''}
          </Text>
        </View>

        {/* 이상적인 매칭 조건 */}
        {lacking.length > 0 ? (
          <>
            <Text style={s.sectionLabel}>내게 필요한 오행</Text>
            <Text style={s.sectionHint}>이 오행이 강한 분과 잘 맞아요</Text>
            {lacking.map((oh) => <ConditionCard key={oh} oh={oh} />)}
          </>
        ) : (
          <View style={s.balancedCard}>
            <Text style={s.balancedText}>✦ 오행이 균형 잡혀 있어요</Text>
            <Text style={s.balancedSub}>다양한 분들과 잘 맞을 수 있어요</Text>
          </View>
        )}

        {/* 매칭 프로필 */}
        <Text style={[s.sectionLabel, { marginTop: 24 }]}>
          궁합 추천 {profiles.length}명
        </Text>
        {displayProfiles.map((p) => (
          <ProfileCard key={p.id} profile={p} lacking={lacking} />
        ))}
        {!showAll && profiles.length > 5 && (
          <TouchableOpacity style={s.moreBtn} onPress={() => setShowAll(true)}>
            <Text style={s.moreBtnText}>더 보기 ({profiles.length - 5}명 더)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  scroll: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#a78bfa', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  myCard: {
    backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#3b2d6e', marginBottom: 24,
  },
  myLabel: { fontSize: 10, color: '#6b6b8e', marginBottom: 4 },
  myName: { fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 4 },
  myPillar: { fontSize: 13, color: '#a78bfa' },
  sectionLabel: { fontSize: 11, color: '#6b6b8e', letterSpacing: 1.2, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: '#4a4a6a', marginBottom: 12 },
  condCard: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    borderWidth: 1, marginBottom: 10,
  },
  condOh: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  condDesc: { fontSize: 13, color: '#94a3b8', marginBottom: 6 },
  condChars: { fontSize: 11, color: '#6b6b8e' },
  balancedCard: {
    backgroundColor: '#0a2e1a', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#4ade80', alignItems: 'center', marginBottom: 16,
  },
  balancedText: { fontSize: 15, color: '#4ade80', fontWeight: '700', marginBottom: 4 },
  balancedSub: { fontSize: 12, color: '#94a3b8' },
  profileCard: {
    backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#2d2d4e', marginBottom: 10,
  },
  profileCardHighlight: { borderColor: '#3b2d6e', backgroundColor: '#1e1535' },
  profileLeft: { flex: 1, position: 'relative' },
  matchDot: { position: 'absolute', top: 0, left: -6, width: 6, height: 6, borderRadius: 3 },
  profileName: { fontSize: 15, fontWeight: '700', color: '#e2e8f0', marginBottom: 2 },
  profileSub: { fontSize: 12, color: '#94a3b8', marginBottom: 2 },
  profilePillar: { fontSize: 12, color: '#6b6b8e' },
  profileRight: { alignItems: 'center', gap: 4 },
  gradeCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: 16, fontWeight: '800' },
  scoreText: { fontSize: 13, fontWeight: '700' },
  matchBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, marginTop: 2 },
  matchBadgeText: { fontSize: 10, fontWeight: '700' },
  moreBtn: { alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#2d2d4e', marginTop: 4 },
  moreBtnText: { color: '#a78bfa', fontSize: 14 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120, gap: 16 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#94a3b8' },
  emptyBtn: { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
