import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export default function JoinGroupScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (code.trim().length !== 6) {
      window.alert('6자리 초대코드를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const q = query(collection(db, 'groups'), where('inviteCode', '==', code.trim().toUpperCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        window.alert('유효하지 않은 초대코드입니다.');
        return;
      }

      const groupDoc = snapshot.docs[0];
      const groupData = groupDoc.data();

      if (groupData.members.includes(user.uid)) {
        window.alert('이미 참여 중인 그룹입니다.');
        return;
      }

      await updateDoc(doc(db, 'groups', groupDoc.id), {
        members: arrayUnion(user.uid),
      });

      window.alert(`"${groupData.name}" 그룹에 참여했어요!`);
      router.replace('/home');
    } catch (e) {
      console.error(e);
      window.alert('참여에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← 뒤로</Text>
      </TouchableOpacity>

      <Text style={styles.title}>초대코드 입력</Text>
      <Text style={styles.subtitle}>친구에게 받은 6자리 코드를 입력하세요</Text>

      <TextInput
        style={styles.input}
        placeholder="예: AB12CD"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        maxLength={6}
      />

      <TouchableOpacity style={styles.button} onPress={handleJoin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '참여 중...' : '참여하기'}</Text>
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
    letterSpacing: 4,
    fontSize: 20,
    textAlign: 'center',
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
