# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 중요: Expo 버전 주의

**Expo v56** 기반 프로젝트다. 코드 작성 전에 반드시 버전별 문서를 확인한다:
https://docs.expo.dev/versions/v56.0.0/

## 프로젝트 개요

`family-shift` — React Native + Expo 모바일 앱. iOS, Android, Web 지원.

- React Native 0.85.3, React 19.2.3, Expo ~56.0.12
- JavaScript (TypeScript 미사용)
- 현재 초기 보일러플레이트 상태

## 개발 명령어

```bash
# 개발 서버 시작 (LAN 모드)
npm start

# 플랫폼별 실행
npm run android   # Android 에뮬레이터/디바이스
npm run ios       # iOS 시뮬레이터/디바이스
npm run web       # 웹 브라우저
```

Expo Go 앱으로 QR 코드를 스캔하면 실기기에서 바로 확인 가능하다.

## 아키텍처

```
family-shift/
├── App.js          # 루트 컴포넌트 (현재 단일 화면)
├── index.js        # 진입점 — registerRootComponent(App)
├── app.json        # Expo 앱 설정 (이름, 아이콘, 플랫폼 옵션)
└── assets/         # 아이콘, 스플래시 이미지
```

현재 상태:
- 라우팅 없음 (단일 스크린)
- 상태 관리 라이브러리 없음
- API 레이어 없음
- 테스트 인프라 없음

네비게이션이 필요하면 Expo Router(v56 권장)를, 상태 관리가 필요하면 Zustand를 사용한다.
