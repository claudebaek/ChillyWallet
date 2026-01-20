#!/bin/bash
# ChillyWallet Screenshot Capture Script

DEVICE="iPhone 17 Pro Max"
OUTPUT_DIR="/Users/leejay100/RNWeb3Wallet/ios/fastlane/screenshots"

echo "📸 ChillyWallet Screenshot Capture"
echo "=================================="
echo ""
echo "Navigate to each screen and press Enter to capture:"
echo ""

mkdir -p "$OUTPUT_DIR/en-US"
mkdir -p "$OUTPUT_DIR/ko"

# Screenshot 1: Onboarding
echo "1. Onboarding Screen (current)"
read -p "Press Enter to capture... "
xcrun simctl io "$DEVICE" screenshot "$OUTPUT_DIR/en-US/iPhone_6.7_01_onboarding.png"
echo "   ✅ Captured!"

# Screenshot 2: Home
echo ""
echo "2. Home Screen (create a wallet first, then navigate to home)"
read -p "Press Enter to capture... "
xcrun simctl io "$DEVICE" screenshot "$OUTPUT_DIR/en-US/iPhone_6.7_02_home.png"
echo "   ✅ Captured!"

# Screenshot 3: Send
echo ""
echo "3. Send Screen (tap Send button)"
read -p "Press Enter to capture... "
xcrun simctl io "$DEVICE" screenshot "$OUTPUT_DIR/en-US/iPhone_6.7_03_send.png"
echo "   ✅ Captured!"

# Screenshot 4: Receive
echo ""
echo "4. Receive Screen (tap Receive button)"
read -p "Press Enter to capture... "
xcrun simctl io "$DEVICE" screenshot "$OUTPUT_DIR/en-US/iPhone_6.7_04_receive.png"
echo "   ✅ Captured!"

# Screenshot 5: Settings
echo ""
echo "5. Settings Screen (tap Settings button)"
read -p "Press Enter to capture... "
xcrun simctl io "$DEVICE" screenshot "$OUTPUT_DIR/en-US/iPhone_6.7_05_settings.png"
echo "   ✅ Captured!"

echo ""
echo "=================================="
echo "✅ All screenshots captured!"
echo "Location: $OUTPUT_DIR/en-US/"
echo ""
ls -la "$OUTPUT_DIR/en-US/"
