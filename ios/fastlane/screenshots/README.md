# App Store Screenshots Guide

## Required Screenshot Sizes

App Store requires screenshots for the following device sizes:

### iPhone Screenshots (Required)

| Device | Size (pixels) | Filename Pattern |
|--------|--------------|------------------|
| iPhone 6.9" (16 Pro Max) | 1320 x 2868 | `iPhone_6.9_*.png` |
| iPhone 6.7" (15 Pro Max) | 1290 x 2796 | `iPhone_6.7_*.png` |
| iPhone 6.5" (14 Plus/13 Pro Max) | 1284 x 2778 | `iPhone_6.5_*.png` |
| iPhone 5.5" (8 Plus) | 1242 x 2208 | `iPhone_5.5_*.png` |

### iPad Screenshots (Optional)

| Device | Size (pixels) | Filename Pattern |
|--------|--------------|------------------|
| iPad Pro 12.9" | 2048 x 2732 | `iPad_12.9_*.png` |
| iPad Pro 11" | 1668 x 2388 | `iPad_11_*.png` |

## Screenshot Naming Convention

Files should be named with locale prefix:
- `en-US/iPhone_6.7_01_home.png`
- `en-US/iPhone_6.7_02_send.png`
- `ko/iPhone_6.7_01_home.png`

## Recommended Screenshots for ChillyWallet

1. **Home Screen** - Show wallet balance and main interface
2. **Send Bitcoin** - Transaction creation screen
3. **Receive Bitcoin** - QR code display
4. **Transaction History** - List of transactions
5. **Settings** - Security and backup options

## How to Create Screenshots

### Option 1: Manual Capture
1. Run the app on Simulator or device
2. Use `Cmd + S` to save screenshot
3. Resize to required dimensions

### Option 2: Using fastlane snapshot
```bash
cd ios
bundle exec fastlane snapshot
```

### Option 3: Using Xcode
1. Product > Test (with UI Tests)
2. Screenshots saved to derived data

## Uploading Screenshots

After adding screenshots:
```bash
cd ios
bundle exec fastlane deliver --skip_binary_upload --skip_metadata
```

Or with metadata:
```bash
bundle exec fastlane deliver --skip_binary_upload
```
