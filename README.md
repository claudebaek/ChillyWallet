# ChillyWallet

<p align="center">
  <img src="ios/RNWeb3Wallet/Images.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png" width="120" height="120" alt="ChillyWallet Logo">
</p>

<p align="center">
  <strong>Bitcoin Cold Storage Wallet</strong><br>
  <em>"There is no second best"</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#testing">Testing</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## Features

### Wallet Management
- **HD Wallet** - BIP39/BIP44 compliant hierarchical deterministic wallet
- **Mnemonic Backup** - 12/24 word recovery phrase support
- **Secure Storage** - Private keys stored in device Keychain/Keystore

### Bitcoin Operations
- **Balance Tracking** - Real-time Bitcoin balance updates
- **Transaction History** - View all incoming/outgoing transactions
- **Send Bitcoin** - Easy and secure Bitcoin transfers
- **Receive Bitcoin** - QR code for address sharing

### Security
- **Biometric Auth** - Face ID / Touch ID support
- **No Third-Party Servers** - Your keys never leave your device
- **Open Source** - Fully auditable codebase

### User Experience
- **Multi-language** - English and Korean support
- **Cold Wallet Design** - Ice blue theme for cold storage
- **Intuitive UI** - Clean and modern interface

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React Native 0.83 |
| **Language** | TypeScript 5.9 |
| **State Management** | Zustand |
| **Server State** | TanStack React Query |
| **Navigation** | React Navigation 7 |
| **Styling** | Styled Components |
| **Crypto** | @scure/bip32, @scure/bip39, @noble/secp256k1 |
| **Security** | react-native-keychain |
| **Testing** | Jest, Testing Library, Detox |

## Project Structure

```
ChillyWallet/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── screens/         # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── SendScreen.tsx
│   │   ├── ReceiveScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/      # React Navigation setup
│   ├── stores/          # Zustand stores
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Business logic
│   │   ├── walletService.ts
│   │   ├── bitcoinService.ts
│   │   └── keychainService.ts
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript definitions
├── __tests__/           # Unit tests
├── e2e/                 # E2E tests (Detox)
├── ios/                 # iOS native code
├── android/             # Android native code
└── scripts/             # Build scripts
```

## Installation

### Prerequisites

- Node.js 20+
- Ruby 3.0+ (for iOS)
- Xcode 15+ (for iOS)
- Android Studio (for Android)
- CocoaPods

### Setup

```bash
# Clone the repository
git clone https://github.com/claudebaek/ChillyWallet.git
cd ChillyWallet

# Install dependencies
npm install

# iOS setup
cd ios
bundle install
pod install
cd ..

# Android setup (if needed)
cd android
./gradlew clean
cd ..
```

## Usage

### Development

```bash
# Start Metro bundler
npm start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android
```

### Building

```bash
# iOS Release build
cd ios
xcodebuild -workspace RNWeb3Wallet.xcworkspace \
  -scheme RNWeb3Wallet \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  build

# Android Release build
cd android
./gradlew assembleRelease
```

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# E2E tests (iOS)
npm run e2e:build:ios
npm run e2e:test:ios

# Lint
npm run lint
```

## Deployment

### TestFlight (iOS)

See [TESTFLIGHT_SETUP.md](./TESTFLIGHT_SETUP.md) for detailed instructions.

```bash
cd ios
bundle install
bundle exec fastlane beta
```

### GitHub Actions

The project includes CI/CD workflows:

- **CI** (`ci.yml`) - Runs on every push/PR
  - Linting
  - Unit tests
  - iOS/Android build verification

- **TestFlight Deploy** (`ios-testflight.yml`) - Manual or tag-triggered
  - Builds release IPA
  - Uploads to TestFlight

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `APPLE_ID` | Apple Developer account email |
| `TEAM_ID` | Apple Developer Team ID |
| `ITC_TEAM_ID` | App Store Connect Team ID |

### App Configuration

Edit `ios/fastlane/Appfile` for iOS deployment settings.

## Security Considerations

- **Private Keys**: Stored encrypted in device Keychain
- **Mnemonic**: Never stored in plain text
- **Network**: All API calls use HTTPS
- **Dependencies**: Regularly audited for vulnerabilities

## Roadmap

- [ ] Real Bitcoin network integration
- [ ] Multiple wallet support
- [ ] Hardware wallet integration (Ledger, Trezor)
- [ ] Lightning Network support
- [ ] Multisig wallet support
- [ ] Watch-only wallets

## Acknowledgments

- [Bitcoin](https://bitcoin.org) - The hardest money ever created
- [React Native](https://reactnative.dev) - Mobile app framework
- [@scure](https://github.com/paulmillr/scure-bip39) - Secure crypto libraries

---

<p align="center">
  <strong>ChillyWallet</strong> - Cold Storage for Your Bitcoin<br>
  <em>"There is no second best"</em>
</p>
