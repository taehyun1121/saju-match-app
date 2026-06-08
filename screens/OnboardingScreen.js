import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, FlatList, Switch, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '../config';

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => ({
    label: String(start + i),
    value: start + i,
  }));
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
            <TouchableOpacity onPress={onClose}>
              <Text style={s.modalClose}>닫기</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.value)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.modalItem}
                onPress={() => { onSelect(item.value); onClose(); }}
              >
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
    <TouchableOpacity
      style={[s.selectBox, disabled && s.selectBoxDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={s.selectLabel}>{label}</Text>
      <Text style={value !== null && value !== undefined ? s.selectValue : s.selectPlaceholder}>
        {value !== null && value !== undefined ? String(value) : placeholder}
      </Text>
    </TouchableOpacity>
  );
}

export default function OnboardingScreen({ navigation }) {
  const [name, setName] = useState('');
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);
  const [day, setDay] = useState(null);
  const [hour, setHour] = useState(null);
  const [minute, setMinute] = useState(0);
  const [hourUnknown, setHourUnknown] = useState(false);
  const [gender, setGender] = useState(null);
  const [picker, setPicker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = name && year && month && day && gender && (hourUnknown || hour !== null);

  async function handleSubmit() {
    if (!canSubmit) { setError('모든 항목을 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/saju`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person: { year, month, day, hour: hourUnknown ? null : hour, gender },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const sajuResult = await res.json();
      const userInfo = { name, year, month, day, hour: hourUnknown ? null : hour, minute: hourUnknown ? null : minute, gender };
      navigation.navigate('MyProfile', { userInfo, sajuResult });
    } catch (e) {
      setError('서버 연결 실패 — 잠시 후 다시 시도해주세요');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>사주 매치</Text>
        <Text style={s.subtitle}>내 정보를 입력해주세요</Text>

        <Text style={s.label}>이름 / 닉네임</Text>
        <TextInput
          style={s.input}
          placeholder="이름을 입력하세요"
          placeholderTextColor="#4a4a6a"
          value={name}
          onChangeText={setName}
        />

        <Text style={s.label}>생년월일</Text>
        <View style={s.row}>
          <SelectBox label="년" value={year} placeholder="년도" onPress={() => setPicker('year')} />
          <SelectBox label="월" value={month} placeholder="월" onPress={() => setPicker('month')} />
          <SelectBox label="일" value={day} placeholder="일" onPress={() => setPicker('day')} />
        </View>

        <Text style={s.label}>태어난 시간</Text>
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

        <Text style={s.label}>성별</Text>
        <View style={s.row}>
          {[['male', '남성'], ['female', '여성']].map(([val, lbl]) => (
            <TouchableOpacity
              key={val}
              style={[s.genderBtn, gender === val && s.genderBtnOn]}
              onPress={() => setGender(val)}
            >
              <Text style={[s.genderText, gender === val && s.genderTextOn]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!error && <Text style={s.error}>{error}</Text>}

        <TouchableOpacity
          style={[s.submitBtn, !canSubmit && s.submitBtnOff]}
          onPress={handleSubmit}
          disabled={loading || !canSubmit}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitText}>내 사주 보기 →</Text>}
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
  title: { fontSize: 32, fontWeight: '700', color: '#a78bfa', textAlign: 'center', marginTop: 16, marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 36 },
  label: { fontSize: 12, color: '#94a3b8', letterSpacing: 0.8, marginBottom: 8, marginTop: 20 },
  input: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    fontSize: 16, borderWidth: 1, borderColor: '#2d2d4e', color: '#e2e8f0',
  },
  row: { flexDirection: 'row', gap: 10 },
  selectBox: {
    flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#2d2d4e',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  selectBoxDisabled: { opacity: 0.4 },
  selectLabel: { fontSize: 11, color: '#6b6b8e' },
  selectValue: { fontSize: 15, color: '#e2e8f0', fontWeight: '600' },
  selectPlaceholder: { fontSize: 13, color: '#4a4a6a' },
  switchBox: {
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#1a1a2e', borderRadius: 12,
    borderWidth: 1, borderColor: '#2d2d4e',
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  switchLabel: { color: '#94a3b8', fontSize: 13 },
  genderBtn: {
    flex: 1, paddingVertical: 14, backgroundColor: '#1a1a2e',
    borderRadius: 12, borderWidth: 1, borderColor: '#2d2d4e', alignItems: 'center',
  },
  genderBtnOn: { backgroundColor: '#3b2d6e', borderColor: '#a78bfa' },
  genderText: { fontSize: 15, color: '#94a3b8', fontWeight: '600' },
  genderTextOn: { color: '#a78bfa' },
  error: { color: '#f87171', marginTop: 14, textAlign: 'center', fontSize: 13 },
  submitBtn: {
    marginTop: 36, backgroundColor: '#7c3aed',
    borderRadius: 16, paddingVertical: 18, alignItems: 'center',
  },
  submitBtnOff: { opacity: 0.35 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
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
