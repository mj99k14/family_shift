import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function CreateGroupScreen() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!groupName.trim()) {
      Alert.alert('입력 오류', '그룹 이름을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const inviteCode = generateInviteCode();
      await addDoc(collection(db, 'groups'), {
        name: groupName.trim(),
        inviteCode,
        members: [user.uid],
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      });
      window.alert(`그룹이 만들어졌어요!\n초대코드: ${inviteCode}`);
      router.replace('/home');
    } catch (e) {
      console.error(e);
      window.alert('그룹 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← 뒤로</Text>
      </TouchableOpacity>

      <Text style={styles.title}>그룹 만들기</Text>
      <Text style={styles.subtitle}>그룹 이름을 정해주세요</Text>

      <TextInput
        style={styles.input}
        placeholder="예: 우리 가족, 편의점 알바팀"
        value={groupName}
        onChangeText={setGroupName}
      />

      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '생성 중...' : '그룹 만들기'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  back: {
    marginTop: 60,
    marginBottom: 32,
  },
  backText: {
    fontSize: 16,
    color: '#2563EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 15,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
