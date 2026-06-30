import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { doc, getDoc, collection, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

const SHIFTS = [
  { key: '오전', color: '#3B82F6', label: '🌅 오전' },
  { key: '오후', color: '#F59E0B', label: '☀️ 오후' },
  { key: '저녁', color: '#8B5CF6', label: '🌙 저녁' },
  { key: '휴무', color: '#9CA3AF', label: '🏖️ 휴무' },
];

const MEMBER_COLORS = ['#2563EB', '#DC2626', '#16A34A', '#D97706', '#7C3AED', '#DB2777'];

export default function GroupScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const user = auth.currentUser;

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [allSchedules, setAllSchedules] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'groups', id)).then(async (snap) => {
      if (!snap.exists()) return;
      const groupData = { id: snap.id, ...snap.data() };
      setGroup(groupData);

      const memberDocs = await Promise.all(
        groupData.members.map((uid) => getDoc(doc(db, 'users', uid)))
      );
      const memberList = memberDocs.map((d, i) => {
        const uid = groupData.members[i];
        let name = '알 수 없음';
        if (d.exists()) {
          name = d.data().name;
        } else if (uid === auth.currentUser?.uid && auth.currentUser?.displayName) {
          name = auth.currentUser.displayName;
        }
        return { uid, name, color: MEMBER_COLORS[i % MEMBER_COLORS.length] };
      });
      setMembers(memberList);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (members.length === 0) return;

    const unsubscribes = members.map((member) => {
      const ref = collection(db, 'schedules', id, member.uid);
      return onSnapshot(ref, (snap) => {
        const data = {};
        snap.docs.forEach((d) => { data[d.id] = d.data().shift; });
        setAllSchedules((prev) => ({ ...prev, [member.uid]: data }));
      });
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [members]);

  async function handleSelectShift(shift) {
    const ref = doc(db, 'schedules', id, user.uid, selectedDate);
    if (shift === null) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, { shift, updatedAt: new Date().toISOString() });
    }
    setModalVisible(false);
  }

  function getMarkedDates() {
    const marked = {};

    members.forEach((member) => {
      const schedule = allSchedules[member.uid] || {};
      Object.keys(schedule).forEach((date) => {
        if (!marked[date]) marked[date] = { dots: [] };
        if (!marked[date].dots) marked[date].dots = [];
        marked[date].dots.push({ key: member.uid, color: member.color });
      });
    });

    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#2563EB',
      };
    }

    return marked;
  }

  function getMyShift() {
    return allSchedules[user.uid]?.[selectedDate] || null;
  }

  function getDaySchedule() {
    if (!selectedDate) return [];
    return members.map((member) => ({
      ...member,
      shift: allSchedules[member.uid]?.[selectedDate] || null,
    }));
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const myShift = getMyShift();
  const shiftColor = SHIFTS.find((s) => s.key === myShift)?.color;
  const today = new Date().toISOString().split('T')[0];
  const isPast = selectedDate && selectedDate < today;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/home')}>
          <Text style={styles.back}>← 홈</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{group?.name}</Text>
        <Text style={styles.memberCount}>멤버 {group?.members?.length}명</Text>
      </View>

      <View style={styles.legend}>
        {members.map((m) => (
          <View key={m.uid} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: m.color }]} />
            <Text style={styles.legendText}>{m.name}</Text>
          </View>
        ))}
      </View>

      <Calendar
        markingType="multi-dot"
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
          if (day.dateString >= today) setModalVisible(true);
        }}
        markedDates={getMarkedDates()}
        theme={{
          todayTextColor: '#2563EB',
          selectedDayBackgroundColor: '#2563EB',
          arrowColor: '#2563EB',
        }}
      />

      {selectedDate && (
        <View style={styles.dayView}>
          <Text style={styles.dayTitle}>{selectedDate} 근무 현황</Text>
          {getDaySchedule().map((m) => (
            <View key={m.uid} style={styles.memberRow}>
              <View style={[styles.memberDot, { backgroundColor: m.color }]} />
              <Text style={styles.memberName}>{m.name}</Text>
              {m.shift ? (
                <View style={[styles.shiftBadge, { backgroundColor: SHIFTS.find(s => s.key === m.shift)?.color }]}>
                  <Text style={styles.shiftBadgeText}>{m.shift}</Text>
                </View>
              ) : (
                <Text style={styles.noShift}>미입력</Text>
              )}
              {m.uid === user.uid && !isPast && (
                <TouchableOpacity style={styles.editBtn} onPress={() => setModalVisible(true)}>
                  <Text style={styles.editBtnText}>수정</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setModalVisible(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{selectedDate}</Text>
          <Text style={styles.sheetSubtitle}>내 근무를 선택하세요</Text>
          {SHIFTS.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.shiftBtn, { borderColor: s.color }, myShift === s.key && { backgroundColor: s.color }]}
              onPress={() => handleSelectShift(s.key)}
            >
              <Text style={[styles.shiftBtnText, myShift === s.key && { color: '#fff' }]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
          {myShift && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => handleSelectShift(null)}>
              <Text style={styles.clearBtnText}>입력 취소</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  back: { fontSize: 16, color: '#2563EB', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  memberCount: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#374151' },
  dayView: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  dayTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 12 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  memberDot: { width: 10, height: 10, borderRadius: 5 },
  memberName: { flex: 1, fontSize: 14, color: '#374151' },
  shiftBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  shiftBadgeText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  noShift: { fontSize: 12, color: '#9CA3AF' },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  editBtnText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  sheetSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  shiftBtn: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  shiftBtnText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  clearBtn: { marginTop: 4, alignItems: 'center', padding: 12 },
  clearBtnText: { fontSize: 14, color: '#9CA3AF' },
});
