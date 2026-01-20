# ChillyWallet - TestFlight Setup Guide

## Prerequisites

1. **Apple Developer Account** ($99/year)
2. **App Store Connect** access
3. **Xcode** installed on macOS
4. **Ruby** and **Bundler** installed

## Initial Setup

### 1. Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: ChillyWallet - Bitcoin Wallet
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: `com.chillywallet.app`
   - **SKU**: `chillywallet-ios`

### 2. Update Bundle Identifier in Xcode

1. Open `ios/RNWeb3Wallet.xcworkspace`
2. Select the project in Navigator
3. Under **Signing & Capabilities**:
   - Set **Team** to your Apple Developer Team
   - Set **Bundle Identifier** to `com.chillywallet.app`

### 3. Configure Fastlane

```bash
cd ios
bundle install
```

### 4. Update Appfile

Edit `ios/fastlane/Appfile`:

```ruby
app_identifier("com.chillywallet.app")
apple_id("your-email@example.com")
itc_team_id("YOUR_ITC_TEAM_ID")  # App Store Connect Team ID
team_id("YOUR_TEAM_ID")          # Developer Portal Team ID
```

To find your Team IDs:
- **Developer Portal Team ID**: [Apple Developer Portal](https://developer.apple.com/account) → Membership
- **App Store Connect Team ID**: Run `fastlane spaceship` or check URL in App Store Connect

## Manual TestFlight Deployment

### Build and Upload

```bash
cd ios
bundle exec fastlane beta
```

This will:
1. Increment build number
2. Build the app
3. Upload to TestFlight

## GitHub Actions Setup (CI/CD)

### Required Secrets

Add these secrets to your GitHub repository:

| Secret | Description |
|--------|-------------|
| `APPLE_ID` | Your Apple ID email |
| `TEAM_ID` | Developer Portal Team ID |
| `ITC_TEAM_ID` | App Store Connect Team ID |
| `CERTIFICATES_P12` | Base64 encoded .p12 certificate |
| `CERTIFICATES_PASSWORD` | Password for .p12 certificate |
| `APP_STORE_CONNECT_API_KEY` | App Store Connect API Key (.p8) |
| `APP_SPECIFIC_PASSWORD` | Apple ID App-Specific Password |
| `MATCH_PASSWORD` | (Optional) Password for match |

### Create App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign In → Security → App-Specific Passwords
3. Generate new password for "Fastlane"

### Create App Store Connect API Key

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Users and Access → Keys → App Store Connect API
3. Generate new key with **App Manager** role
4. Download the .p8 file

### Export Certificate

```bash
# Export from Keychain Access as .p12
# Then encode as base64:
base64 -i certificate.p12 -o certificate_base64.txt
```

## Triggering Deployments

### Manual Trigger
- Go to Actions → iOS TestFlight Deploy → Run workflow

### Automatic Trigger
- Push to `release/*` branch
- Create a tag like `v1.0.0`

## Troubleshooting

### Code Signing Issues
```bash
# Reset code signing
cd ios
rm -rf ~/Library/MobileDevice/Provisioning\ Profiles/*
fastlane match appstore --force
```

### Build Failures
```bash
# Clean build
cd ios
rm -rf ~/Library/Developer/Xcode/DerivedData
pod deintegrate
pod install
```

### Check TestFlight Status
- Go to App Store Connect → TestFlight → iOS Builds
- Processing usually takes 5-15 minutes

## Version Management

### Semantic Versioning
- **Major** (1.x.x): Breaking changes
- **Minor** (x.1.x): New features
- **Patch** (x.x.1): Bug fixes

### Update Version
```bash
cd ios
# Increment version
fastlane run increment_version_number bump_type:patch

# Increment build number
fastlane run increment_build_number
```

## Contact

For issues with this setup, please open a GitHub issue.
