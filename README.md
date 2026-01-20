# RNWeb3Wallet

두나무 iOS Engineer 포지션 준비를 위한 React Native Web3 지갑 앱 포트폴리오 프로젝트입니다.

## 기술 스택

| 카테고리 | 기술 |
|----------|------|
| **Core** | React Native, TypeScript |
| **State** | zustand (전역 상태), @tanstack/react-query (서버 상태) |
| **Web3** | viem (이더리움 라이브러리), WalletConnect v2 |
| **UI** | styled-components |
| **Testing** | jest (유닛), detox (E2E) |
| **Navigation** | @react-navigation/native |

## 프로젝트 구조

```
RNWeb3Wallet/
├── src/
│   ├── components/     # 재사용 UI 컴포넌트 (Button, Card, Input)
│   ├── screens/        # 화면 컴포넌트
│   ├── navigation/     # React Navigation 설정
│   ├── stores/         # zustand 스토어 (wallet, wc)
│   ├── hooks/          # react-query 훅 (balance, gas, tx)
│   ├── services/       # 비즈니스 로직 (wallet, keychain, walletconnect)
│   ├── utils/          # 유틸리티 함수
│   └── types/          # TypeScript 타입 정의
├── __tests__/          # jest 유닛 테스트
├── e2e/                # detox E2E 테스트
└── ...config files
```

## 주요 기능

### 1. 지갑 관리
- 니모닉 시드 생성/복구 (viem)
- 다중 계정 지원
- Keychain 보안 저장소

### 2. 잔액 조회 및 트랜잭션
- ETH 잔액 조회 (react-query)
- 가스비 추정
- ETH 전송

### 3. WalletConnect v2
- dApp 연결/해제
- 세션 관리
- 서명 요청 처리

### 4. 네트워크
- Ethereum Mainnet
- Sepolia Testnet

## 설치 및 실행

```bash
# 의존성 설치
npm install

# iOS (macOS only)
cd ios && pod install && cd ..
npm run ios

# Android
npm run android

# 개발 서버
npm start
```

## 테스트

```bash
# 유닛 테스트
npm test

# 테스트 커버리지
npm run test:coverage

# E2E 테스트 (iOS)
npm run e2e:build:ios
npm run e2e:test:ios
```

## 상태 관리 패턴

### zustand - 로컬 상태
```typescript
const { currentAccount, isLocked, setNetwork } = useWalletStore();
```

### react-query - 서버 상태
```typescript
const { balance, isLoading, refetch } = useFormattedBalance();
const { mutate: sendTx } = useSendTransaction();
```

## 두나무 채용 요건 대응

| 요건 | 구현 |
|------|------|
| React Native + TypeScript | ✅ 전체 프로젝트 |
| 상태관리 (zustand, react-query) | ✅ stores/, hooks/ |
| WalletConnect | ✅ services/walletConnectService.ts |
| viem | ✅ services/walletService.ts |
| styled-components | ✅ components/, screens/ |
| jest | ✅ __tests__/ |
| detox | ✅ e2e/ |

## 주의사항

- `WALLETCONNECT_PROJECT_ID`를 실제 프로젝트 ID로 교체 필요
- react-native-keychain은 실제 디바이스에서만 동작
- 프로덕션 배포 시 보안 강화 필요

## 라이선스

MIT
