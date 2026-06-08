import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, FlatList, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '../config';

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => ({ label: String(start + i), value: start + i }));
}
const YEARS = range(1900, 2010).reverse();
const MONTHS = range(1, 12);
const DAYS = range(1, 31);
const HOURS = range(0, 23);
const MINUTES = Array.from({ length: 12 }, (_, i) => ({ label: String(i * 5).padStart(2, '0'), value: i * 5 }));

function PickerModal({ visible, items, onSelect, onClose, title }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalSheet}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Text style={s.modalClose}>닫기</Text></TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.value)}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.modalItem} onPress={() => { onSelect(item.value); onClose(); }}>
                <Text style={s.modalItemText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

function SelectBox({ label, value, placeholder, onPress, disabled }) {
  return (
    <TouchableOpacity style={[s.selectBox, disabled && { opacity: 0.4 }]} onPress={onPress} disabled={disabled}>
      <Text style={s.selectLabel}>{label}</Text>
      <Text style={value !== null && value !== undefined ? s.selectValue : s.selectPlaceholder}>
        {value !== null && value !== undefined ? String(value) : placeholder}
      </Text>
    </TouchableOpacity>
  );
}

const GRADE_COLORS = { 최상: '#a78bfa', 상: '#60a5fa', 중: '#fbbf24', 하: '#f87171', S: '#f59e0b', A: '#a78bfa', B: '#60a5fa', C: '#4ade80', D: '#f87171' };
const GRADE_BG    = { 최상: '#2a1a5e', 상: '#0c2340', 중: '#3d2e00', 하: '#2e0a0a', S: '#2d1f00', A: '#2a1a5e', B: '#0c2340', C: '#0a2e1a', D: '#2e0a0a' };
const GRADE_STARS = { 최상: '★★★★★', 상: '★★★★☆', 중: '★★★☆☆', 하: '★★☆☆☆' };

function ScoreBar({ score, max, color }) {
  return (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: `${(score / max) * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function CompatibilityScreen({ navigation, route }) {
  const { userInfo, sajuResult } = route?.params || {};
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);
  const [day, setDay] = useState(null);
  const [hour, setHour] = useState(null);
  const [minute, setMinute] = useState(0);
  const [hourUnknown, setHourUnknown] = useState(false);
  const [gender, setGender] = useState(null);
  const [picker, setPicker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const canCalc = year && month && day && gender && (hourUnknown || hour !== null) && userInfo;

  async function handleCalc() {
    if (!canCalc) { setError('상대방 정보를 모두 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API}/compatibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person1: {
            year: userInfo.year, month: userInfo.month, day: userInfo.day,
            hour: userInfo.hour, gender: userInfo.gender,
          },
          person2: {
            year, month, day,
            hour: hourUnknown ? null : hour,
            gender,
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setError('서버 연결 실패 — 잠시 후 다시 시도해주세요');
    } finally {
      setLoading(false);
    }
  }

  const grade = result?.grade;
  const gradeColor = GRADE_COLORS[grade] || '#a78bfa';
  const gradeBg = GRADE_BG[grade] || '#1a1a2e';

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>궁합 테스트</Text>

        {/* 내 정보 요약 */}
        {userInfo && (
          <View style={s.myInfoCard}>
            <Text style={s.myInfoLabel}>나</Text>
            <Text style={s.myInfoText}>
              {userInfo.name} · {userInfo.year}.{String(userInfo.month).padStart(2,'0')}.{String(userInfo.day).padStart(2,'0')} · {userInfo.gender === 'male' ? '남성' : '여성'}
            </Text>
          </View>
        )}

        {!userInfo && (
          <View style={s.warnCard}>
            <Text style={s.warnText}>먼저 내 정보를 입력해주세요.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Onboarding')}>
              <Text style={s.link}>온보딩으로 →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 상대방 입력 */}
        <Text style={s.sectionLabel}>상대방 생년월일</Text>
        <View style={s.row}>
          <SelectBox label="년" value={year} placeholder="년도" onPress={() => setPicker('year')} />
          <SelectBox label="월" value={month} placeholder="월" onPress={() => setPicker('month')} />
          <SelectBox label="일" value={day} placeholder="일" onPress={() => setPicker('day')} />
        </View>

        <Text style={s.sectionLabel}>태어난 시간</Text>
        <View style={s.row}>
          <SelectBox
            label="시"
            value={hourUnknown ? '모름' : hour}
            placeholder="시"
            onPress={() => setPicker('hour')}
            disabled={hourUnknown}
          />
          <SelectBox
            label="분"
            value={hourUnknown ? '-' : String(minute).padStart(2, '0')}
            placeholder="분"
            onPress={() => setPicker('minute')}
            disabled={hourUnknown}
          />
          <View style={s.switchBox}>
            <Text style={s.switchLabel}>모름</Text>
            <Switch
              value={hourUnknown}
              onValueChange={(v) => { setHourUnknown(v); setHour(null); setMinute(0); }}
              trackColor={{ false: '#2d2d4e', true: '#7c3aed' }}
              thumbColor={hourUnknown ? '#a78bfa' : '#6b6b8e'}
            />
          </View>
        </View>

        <Text style={s.sectionLabel}>성별</Text>
        <View style={s.row}>
          {[['male', '남성'], ['female', '여성']].map(([val, label]) => (
            <TouchableOpacity
              key={val}
              style={[s.genderBtn, gender === val && s.genderBtnOn]}
              onPress={() => setGender(val)}
            >
              <Text style={[s.genderText, gender === val && s.genderTextOn]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!error && <Text style={s.error}>{error}</Text>}

        <TouchableOpacity
          style={[s.calcBtn, !canCalc && s.calcBtnOff]}
          onPress={handleCalc}
          disabled={loading || !canCalc}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.calcBtnText}>궁합 점수 계산 →</Text>}
        </TouchableOpacity>

        {/* 결과 */}
        {result && (
          <View style={s.resultContainer}>
            {/* 총점 + 등급 */}
            <View style={[s.scoreCard, { backgroundColor: gradeBg, borderColor: gradeColor }]}>
              {GRADE_STARS[grade] && <Text style={s.gradeStars}>{GRADE_STARS[grade]}</Text>}
              <Text style={[s.gradeText, { color: gradeColor }]}>{grade}</Text>
              <Text style={[s.totalScore, { color: gradeColor }]}>{result.total ?? result.score ?? 0}점</Text>
              {!!result.grade_label && <Text style={s.gradeLabel}>{result.grade_label}</Text>}
              {!!result.comment && <Text style={s.commentInCard}>{result.comment}</Text>}
            </View>

            {/* 항목별 */}
            {result.details && (
              <>
                <Text style={s.sectionLabel}>항목별 점수</Text>
                {Object.entries(result.details).map(([key, d]) => {
                  const max = d.max ?? 100;
                  return (
                    <View key={key} style={s.detailRow}>
                      <View style={s.detailTop}>
                        <Text style={s.detailLabel}>{d.label || key}</Text>
                        <Text style={s.detailScore}>{d.score} / {max}</Text>
                      </View>
                      <ScoreBar score={d.score} max={max} color="#a78bfa" />
                      {!!d.relation && <Text style={s.detailRelation}>{d.relation}</Text>}
                      {!!d.desc && <Text style={s.detailDesc}>{d.desc}</Text>}
                    </View>
                  );
                })}
              </>
            )}

            {/* 원국 비교 */}
            {result.person1 && result.person2 && (
              <>
                <Text style={s.sectionLabel}>원국 비교</Text>
                <View style={s.compareRow}>
                  {[
                    { label: '나', p: result.person1 },
                    { label: '상대', p: result.person2 },
                  ].map(({ label, p }) => (
                    <View key={label} style={s.compareCard}>
                      <Text style={s.compareTitle}>{label}</Text>
                      {p.ilgan && <Text style={s.compareItem}>일간 <Text style={s.compareVal}>{p.ilgan}</Text></Text>}
                      {p.ilji && <Text style={s.compareItem}>일지 <Text style={s.compareVal}>{p.ilji}</Text></Text>}
                      {p.yeonji && <Text style={s.compareItem}>연지 <Text style={s.compareVal}>{p.yeonji}</Text></Text>}
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        <TouchableOpacity style={s.ghostBtn} onPress={() => navigation.goBack()}>
          <Text style={s.ghostBtnText}>← 내 사주로 돌아가기</Text>
        </TouchableOpacity>
      </ScrollView>

      <PickerModal visible={picker === 'year'} title="출생 년도" items={YEARS} onSelect={setYear} onClose={() => setPicker(null)} />
      <PickerModal visible={picker === 'month'} title="출생 월" items={MONTHS} onSelect={setMonth} onClose={() => setPicker(null)} />
      <PickerModal visible={picker === 'day'} title="출생 일" items={DAYS} onSelect={setDay} onClose={() => setPicker(null)} />
      <PickerModal visible={picker === 'hour'} title="태어난 시간 (0~23시)" items={HOURS} onSelect={setHour} onClose={() => setPicker(null)} />
      <PickerModal visible={picker === 'minute'} title="태어난 분 (0~55분)" items={MINUTES} onSelect={setMinute} onClose={() => setPicker(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  scroll: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#a78bfa', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  myInfoCard: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#2d2d4e', marginBottom: 24,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  myInfoLabel: { fontSize: 12, color: '#a78bfa', fontWeight: '700', width: 20 },
  myInfoText: { fontSize: 13, color: '#94a3b8', flex: 1 },
  warnCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 20, alignItems: 'center' },
  warnText: { color: '#94a3b8', marginBottom: 8 },
  link: { color: '#a78bfa', fontSize: 14 },
  sectionLabel: { fontSize: 11, color: '#6b6b8e', letterSpacing: 1.2, marginBottom: 10, marginTop: 20 },
  row: { flexDirection: 'row', gap: 10 },
  switchBox: {
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#1a1a2e', borderRadius: 12,
    borderWidth: 1, borderColor: '#2d2d4e',
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  switchLabel: { color: '#94a3b8', fontSize: 13 },
  selectBox: {
    flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#2d2d4e',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  selectLabel: { fontSize: 11, color: '#6b6b8e' },
  selectValue: { fontSize: 15, color: '#e2e8f0', fontWeight: '600' },
  selectPlaceholder: { fontSize: 13, color: '#4a4a6a' },
  toggleBtn: {
    paddingHorizontal: 18, paddingVertical: 14,
    backgroundColor: '#1a1a2e', borderRadius: 12, borderWidth: 1, borderColor: '#2d2d4e',
  },
  toggleBtnOn: { backgroundColor: '#3b2d6e', borderColor: '#a78bfa' },
  toggleText: { color: '#94a3b8', fontSize: 14 },
  toggleTextOn: { color: '#a78bfa', fontWeight: '600' },
  genderBtn: {
    flex: 1, paddingVertical: 14, backgroundColor: '#1a1a2e',
    borderRadius: 12, borderWidth: 1, borderColor: '#2d2d4e', alignItems: 'center',
  },
  genderBtnOn: { backgroundColor: '#3b2d6e', borderColor: '#a78bfa' },
  genderText: { fontSize: 15, color: '#94a3b8', fontWeight: '600' },
  genderTextOn: { color: '#a78bfa' },
  error: { color: '#f87171', marginTop: 12, textAlign: 'center', fontSize: 13 },
  calcBtn: {
    marginTop: 28, backgroundColor: '#7c3aed',
    borderRadius: 16, paddingVertical: 18, alignItems: 'center',
  },
  calcBtnOff: { opacity: 0.35 },
  calcBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  resultContainer: { marginTop: 32 },
  scoreCard: {
    borderRadius: 20, padding: 32, alignItems: 'center',
    borderWidth: 2, marginBottom: 24,
  },
  gradeStars: { fontSize: 18, marginBottom: 6 },
  gradeText: { fontSize: 44, fontWeight: '900', letterSpacing: 2 },
  totalScore: { fontSize: 34, fontWeight: '700', marginTop: 4 },
  gradeLabel: { fontSize: 15, color: '#94a3b8', marginTop: 8 },
  commentInCard: { fontSize: 13, color: '#c4b5fd', marginTop: 10, textAlign: 'center', lineHeight: 20 },
  ghostBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
  ghostBtnText: { color: '#6b6b8e', fontSize: 14 },
  detailRow: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#2d2d4e',
  },
  detailTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 13, color: '#e2e8f0', fontWeight: '600' },
  detailScore: { fontSize: 13, color: '#a78bfa', fontWeight: '700' },
  barTrack: { height: 6, backgroundColor: '#2d2d4e', borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  detailRelation: { fontSize: 12, color: '#a78bfa', marginBottom: 4 },
  detailDesc: { fontSize: 12, color: '#94a3b8' },
  compareRow: { flexDirection: 'row', gap: 12 },
  compareCard: {
    flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2d2d4e',
  },
  compareTitle: { fontSize: 12, color: '#6b6b8e', marginBottom: 10, textAlign: 'center' },
  compareItem: { fontSize: 13, color: '#94a3b8', marginBottom: 6 },
  compareVal: { color: '#a78bfa', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#2d2d4e',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0' },
  modalClose: { fontSize: 14, color: '#a78bfa' },
  modalItem: { paddingVertical: 14, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#151525' },
  modalItemText: { fontSize: 16, color: '#e2e8f0', textAlign: 'center' },
});
