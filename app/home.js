import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export default function HomeScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setGroups(list);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function handleLogout() {
    await signOut(auth);
    router.replace('/');
  }

  async function confirmDelete(group) {
    const ok = window.confirm(`"${group.name}" 그룹을 삭제할까요?\n멤버 전체가 그룹에서 나가게 됩니다.`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'groups', group.id));
    } catch (e) {
      console.error('삭제 실패:', e);
      window.alert(`삭제 실패: ${e.message}`);
    }
  }

  async function confirmLeave(group) {
    const ok = window.confirm(`"${group.name}" 그룹에서 나갈까요?`);
    if (!ok) return;
    try {
      await updateDoc(doc(db, 'groups', group.id), {
        members: arrayRemove(user.uid),
      });
    } catch (e) {
      console.error('나가기 실패:', e);
      window.alert(`나가기 실패: ${e.message}`);
    }
  }

  function renderGroup({ item }) {
    const isOwner = item.createdBy === user.uid;
    return (
      <Pressable style={styles.groupCard} onPress={() => router.push(`/group/${item.id}`)}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupCode}>초대코드: {item.inviteCode}</Text>
          <Text style={styles.groupMembers}>멤버 {item.members.length}명</Text>
        </View>
        <TouchableOpacity
          style={[styles.actionBtn, isOwner ? styles.deleteBtn : styles.leaveBtn]}
          onPress={() => isOwner ? confirmDelete(item) : confirmLeave(item)}
        >
          <Text style={styles.actionBtnText}>{isOwner ? '삭제' : '나가기'}</Text>
        </TouchableOpacity>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>안녕하세요, {user?.displayName || ''}님!</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>내 그룹</Text>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color="#2563EB" />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 그룹이 없어요</Text>
          <Text style={styles.emptySubText}>그룹을 만들거나 초대코드로 참여해보세요</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          style={styles.list}
        />
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/create-group')}>
          <Text style={styles.buttonText}>+ 그룹 만들기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={() => router.push('/join-group')}>
          <Text style={styles.buttonOutlineText}>초대코드 입력</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 32,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  logout: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: '#D1D5DB',
  },
  list: {
    flex: 1,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  groupCode: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 13,
    color: '#2563EB',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  leaveBtn: {
    backgroundColor: '#F3F4F6',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    marginTop: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  buttonOutlineText: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
