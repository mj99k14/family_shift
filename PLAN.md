# family-shift 개발 계획

## 앱 개요

가족/친구끼리 그룹을 만들어 서로의 근무 일정을 공유하는 모바일 앱.
내 출근 여부(오전/오후/저녁/휴무)를 입력하면 그룹원 전체가 달력에서 확인 가능.

---

## 기술 스택

| 분류 | 선택 | 이유 |
|------|------|------|
| 프론트엔드 | React Native + Expo SDK 56 | iOS/Android/Web 동시 지원 |
| 백엔드/DB | Firebase (Firestore) | 실시간 동기화, 무료 |
| 인증 | Firebase Auth | 이메일 로그인 |
| 달력 | react-native-calendars | 멀티 dot 마킹 지원 |
| 배포 | EAS Build → App Store / Play Store | 실제 앱 배포 |

---

## Phase 1 — Firebase 연결 + 인증 ✅ 완료

- [x] Firebase 프로젝트 생성 및 config 연결 (환경변수로 관리)
- [x] expo-router 도입 및 화면 구조 세팅
- [x] 이메일/비밀번호 회원가입
- [x] 이메일/비밀번호 로그인
- [x] 로그아웃
- [x] 로그인 상태 유지 (앱 재실행 시 자동 로그인)

---

## Phase 2 — 그룹 기능 ✅ 완료

- [x] 그룹 생성 (그룹명 입력 → Firestore에 저장)
- [x] 초대코드 자동 생성 (6자리 랜덤)
- [x] 초대코드로 그룹 참여
- [x] 내가 속한 그룹 목록 실시간 표시
- [x] 그룹 삭제 (그룹장만 가능)
- [x] 그룹 나가기 (일반 멤버)

---

## Phase 3 — 근무 입력 ✅ 완료

- [x] 달력 UI (월별 보기, react-native-calendars)
- [x] 날짜 선택 → 근무 유형 선택 (오전 / 오후 / 저녁 / 휴무)
- [x] 선택한 근무 Firestore에 저장
- [x] 내 근무 달력에 색상으로 표시
- [x] 근무 수정 / 삭제

---

## Phase 4 — 그룹 달력 뷰 ✅ 완료

- [x] 그룹 달력 화면 (app/group/[id].js)
- [x] 멤버별 색상 dots 달력에 표시
- [x] 날짜 선택 시 그룹원별 근무 목록 표시
- [x] 실시간 업데이트 (누가 수정하면 바로 반영)

---

## Phase 5 — 마무리 & 배포 🔜 다음

- [ ] UI 전체 다듬기
- [ ] 로딩/에러 처리 보완
- [ ] EAS Build 설정
- [ ] TestFlight (iOS) 배포 테스트
- [ ] App Store / Play Store 제출

---

## 화면 구조

```
/ (로그인 화면)
├── /register           회원가입
├── /home               내 그룹 목록
│   ├── /group/[id]     그룹 달력 (전체 멤버 근무 보기 + 내 근무 입력)
├── /create-group       그룹 만들기
└── /join-group         초대코드로 참여
```

---

## Firestore 데이터 구조

```
users/
  {uid}/
    name: string
    email: string

groups/
  {groupId}/
    name: string
    inviteCode: string (6자리)
    members: [uid, ...]
    createdBy: uid

schedules/
  {groupId}/
    {uid}/
      {날짜 "2026-07-01"}/
        shift: "오전" | "오후" | "저녁" | "휴무"
        updatedAt: string
```

---

## 개발 명령어

```bash
npx expo start --web --clear   # 웹 개발 서버
npm run android                # Android
npm run ios                    # iOS
```
