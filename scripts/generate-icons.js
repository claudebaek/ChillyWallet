#!/usr/bin/env node
/**
 * ChillyWallet App Icon Generator
 * 
 * Generates app icons for iOS and Android from an SVG source
 * 
 * Usage:
 *   npm install sharp
 *   node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

const sharp = require('sharp');

// Flatten alpha by compositing on solid background and removing alpha channel
async function flattenImage(svgBuffer, size) {
  return sharp(svgBuffer)
    .resize(size, size)
    .flatten({ background: { r: 41, g: 182, b: 246 } }) // #29B6F6
    .removeAlpha()
    .png()
    .toBuffer();
}

// ChillyWallet Icon SVG - Bitcoin symbol with ice/cold theme
const ICON_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradient for icy/cold effect -->
    <linearGradient id="iceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4FC3F7;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#29B6F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0288D1;stop-opacity:1" />
    </linearGradient>
    <!-- Inner shadow/glow -->
    <radialGradient id="innerGlow" cx="30%" cy="30%" r="70%">
      <stop offset="0%" style="stop-color:#B3E5FC;stop-opacity:0.6" />
      <stop offset="100%" style="stop-color:#0288D1;stop-opacity:0" />
    </radialGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="512" cy="512" r="480" fill="url(#iceGradient)"/>
  <circle cx="512" cy="512" r="480" fill="url(#innerGlow)"/>
  
  <!-- Snowflake decorations (subtle) -->
  <g fill="rgba(255,255,255,0.15)" transform="translate(512,512)">
    <!-- Top snowflake arm -->
    <path d="M0,-400 L10,-350 L0,-300 L-10,-350 Z"/>
    <path d="M0,-400 L20,-380 L0,-360 L-20,-380 Z"/>
    <!-- Bottom snowflake arm -->
    <path d="M0,400 L10,350 L0,300 L-10,350 Z"/>
    <path d="M0,400 L20,380 L0,360 L-20,380 Z"/>
    <!-- Left snowflake arm -->
    <path d="M-400,0 L-350,10 L-300,0 L-350,-10 Z"/>
    <path d="M-400,0 L-380,20 L-360,0 L-380,-20 Z"/>
    <!-- Right snowflake arm -->
    <path d="M400,0 L350,10 L300,0 L350,-10 Z"/>
    <path d="M400,0 L380,20 L360,0 L380,-20 Z"/>
  </g>
  
  <!-- Bitcoin "B" symbol -->
  <g fill="white" transform="translate(512,512)">
    <!-- Vertical bars -->
    <rect x="-40" y="-280" width="30" height="560" rx="15"/>
    <rect x="10" y="-280" width="30" height="560" rx="15"/>
    
    <!-- Top horizontal strokes -->
    <rect x="-40" y="-280" width="180" height="30" rx="15"/>
    <rect x="-40" y="-200" width="200" height="30" rx="15"/>
    
    <!-- Middle stroke -->
    <rect x="-40" y="-15" width="220" height="30" rx="15"/>
    
    <!-- Bottom horizontal strokes -->
    <rect x="-40" y="170" width="200" height="30" rx="15"/>
    <rect x="-40" y="250" width="180" height="30" rx="15"/>
    
    <!-- Top curve (right side of B) -->
    <path d="M100,-280 
             Q220,-280 220,-140 
             Q220,-15 100,-15 
             L100,-280 Z" 
          fill="white"/>
    <path d="M130,-250 
             Q190,-250 190,-140 
             Q190,-45 130,-45 
             L130,-250 Z" 
          fill="url(#iceGradient)"/>
    
    <!-- Bottom curve (right side of B) -->
    <path d="M100,15 
             Q240,15 240,140 
             Q240,280 100,280 
             L100,15 Z" 
          fill="white"/>
    <path d="M130,45 
             Q200,45 200,140 
             Q200,250 130,250 
             L130,45 Z" 
          fill="url(#iceGradient)"/>
  </g>
  
  <!-- Small ice crystals around the edge -->
  <g fill="rgba(255,255,255,0.3)">
    <circle cx="150" cy="200" r="8"/>
    <circle cx="874" cy="300" r="6"/>
    <circle cx="200" cy="750" r="10"/>
    <circle cx="800" cy="800" r="7"/>
    <circle cx="120" cy="500" r="5"/>
    <circle cx="900" cy="550" r="8"/>
  </g>
</svg>`;

// Icon sizes needed
const IOS_ICONS = [
  { size: 40, scale: 2, name: 'Icon-App-20x20@2x.png' },
  { size: 60, scale: 3, name: 'Icon-App-20x20@3x.png' },
  { size: 58, scale: 2, name: 'Icon-App-29x29@2x.png' },
  { size: 87, scale: 3, name: 'Icon-App-29x29@3x.png' },
  { size: 80, scale: 2, name: 'Icon-App-40x40@2x.png' },
  { size: 120, scale: 3, name: 'Icon-App-40x40@3x.png' },
  { size: 120, scale: 2, name: 'Icon-App-60x60@2x.png' },
  { size: 180, scale: 3, name: 'Icon-App-60x60@3x.png' },
  { size: 1024, scale: 1, name: 'Icon-App-1024x1024@1x.png' },
];

const ANDROID_ICONS = [
  { size: 48, folder: 'mipmap-mdpi' },
  { size: 72, folder: 'mipmap-hdpi' },
  { size: 96, folder: 'mipmap-xhdpi' },
  { size: 144, folder: 'mipmap-xxhdpi' },
  { size: 192, folder: 'mipmap-xxxhdpi' },
];

async function generateIcons() {
  console.log('🎨 ChillyWallet App Icon Generator');
  console.log('===================================\n');

  const projectRoot = path.join(__dirname, '..');
  const iosIconPath = path.join(projectRoot, 'ios/RNWeb3Wallet/Images.xcassets/AppIcon.appiconset');
  const androidResPath = path.join(projectRoot, 'android/app/src/main/res');

  // Create SVG buffer
  const svgBuffer = Buffer.from(ICON_SVG);

  // Generate iOS icons
  console.log('📱 Generating iOS icons...');
  for (const icon of IOS_ICONS) {
    const outputPath = path.join(iosIconPath, icon.name);
    const flatBuffer = await flattenImage(svgBuffer, icon.size);
    await sharp(flatBuffer).toFile(outputPath);
    console.log(`  ✅ ${icon.name} (${icon.size}x${icon.size})`);
  }

  // Update iOS Contents.json
  const iosContentsJson = {
    images: [
      { filename: 'Icon-App-20x20@2x.png', idiom: 'iphone', scale: '2x', size: '20x20' },
      { filename: 'Icon-App-20x20@3x.png', idiom: 'iphone', scale: '3x', size: '20x20' },
      { filename: 'Icon-App-29x29@2x.png', idiom: 'iphone', scale: '2x', size: '29x29' },
      { filename: 'Icon-App-29x29@3x.png', idiom: 'iphone', scale: '3x', size: '29x29' },
      { filename: 'Icon-App-40x40@2x.png', idiom: 'iphone', scale: '2x', size: '40x40' },
      { filename: 'Icon-App-40x40@3x.png', idiom: 'iphone', scale: '3x', size: '40x40' },
      { filename: 'Icon-App-60x60@2x.png', idiom: 'iphone', scale: '2x', size: '60x60' },
      { filename: 'Icon-App-60x60@3x.png', idiom: 'iphone', scale: '3x', size: '60x60' },
      { filename: 'Icon-App-1024x1024@1x.png', idiom: 'ios-marketing', scale: '1x', size: '1024x1024' },
    ],
    info: { author: 'xcode', version: 1 }
  };
  
  fs.writeFileSync(
    path.join(iosIconPath, 'Contents.json'),
    JSON.stringify(iosContentsJson, null, 2)
  );
  console.log('  ✅ Updated Contents.json\n');

  // Generate Android icons
  console.log('🤖 Generating Android icons...');
  for (const icon of ANDROID_ICONS) {
    const folderPath = path.join(androidResPath, icon.folder);
    
    // Square icon
    const squarePath = path.join(folderPath, 'ic_launcher.png');
    await sharp(svgBuffer)
      .resize(icon.size, icon.size)
      .png()
      .toFile(squarePath);
    console.log(`  ✅ ${icon.folder}/ic_launcher.png (${icon.size}x${icon.size})`);

    // Round icon
    const roundPath = path.join(folderPath, 'ic_launcher_round.png');
    await sharp(svgBuffer)
      .resize(icon.size, icon.size)
      .png()
      .toFile(roundPath);
    console.log(`  ✅ ${icon.folder}/ic_launcher_round.png (${icon.size}x${icon.size})`);
  }

  console.log('\n🎉 All icons generated successfully!');
  console.log('\n📋 Summary:');
  console.log(`   iOS: ${IOS_ICONS.length} icons`);
  console.log(`   Android: ${ANDROID_ICONS.length * 2} icons`);
}

generateIcons().catch(console.error);
