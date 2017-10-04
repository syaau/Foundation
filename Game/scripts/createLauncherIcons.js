#!/usr/bin/env node
const fs = require('fs');
const svg2png = require('svg2png');
const path = require('path');

// Use white background color by default for ios marketing icons
// Use `blank` to skip adding background color
const backgroundColor = process.argv[2] || 'white';
const iosFolder = path.resolve(__dirname, '../ios/Game/Images.xcassets/AppIcon.appiconset/');
const androidFolder = path.resolve(__dirname, '../android/app/src/main/res/');

const iosInfo = require('../ios/Game/Images.xcassets/AppIcon.appiconset/Contents.json');

const androidInfo = [
  { name: 'ldpi', size: 36 },
  { name: 'mdpi', size: 48 },
  { name: 'hdpi', size: 72 },
  { name: 'xhdpi', size: 96 },
  { name: 'xxhdpi', size: 144 },
  { name: 'xxxhdpi', size: 192 },
];

const assetsFolder = path.resolve(__dirname, '../app/assets/icons');
const launcherSVG = path.resolve(assetsFolder, 'launcher.svg');
const svg = fs.readFileSync(launcherSVG).toString();

const iosImages = {};
// First convert ios app icons
const res = iosInfo.images.map((image) => {
  const size = parseInt(image.size.split('x')[0], 10);
  const scale = parseInt(image.scale.split('x')[0], 10);
  const dimen = size * scale;

  const filename = image.filename || `launcher_${dimen}px${image.idiom === 'ios-marketing' ? '-marketing' : ''}.png`;
  // console.log('Size', size * scale)

  if (!iosImages[filename]) {
    iosImages[filename] = true;
    console.log('Converting svg to', dimen, 'for ios');

    let svgToUse = svg;
    // Marketing images cannot have transparent backgrounds
    if (image.idiom === 'ios-marketing' && backgroundColor !== 'blank') {
      // Add a rect object with background fill
      const rect = `<rect width="100%" height="100%" style="fill: ${backgroundColor}" />`;
      const idx = svg.indexOf('<svg ');
      const pos = svg.indexOf('>', idx + 1);
      svgToUse = `${svg.substring(0, pos + 1)}${rect}${svg.substring(pos + 1)}`;
    }

    const outputBuffer = svg2png.sync(svgToUse, {
      width: dimen,
      height: dimen,
    });

    // Save the png file
    const file = path.resolve(iosFolder, filename);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
    fs.writeFileSync(file, outputBuffer);
  }

  return {
    ...image,
    filename,
  };
});

const jsonFile = path.resolve(iosFolder, 'Contents.json');
fs.unlinkSync(jsonFile);
fs.writeFileSync(jsonFile, JSON.stringify({ images: res }, null, 2));

// Convert android launcher icons
androidInfo.forEach((info) => {
  console.log('Converting svg to', info.size, 'for android', info.name);
  const outputBuffer = svg2png.sync(svg, {
    width: info.size,
    height: info.size,
  });

  const folder = path.resolve(androidFolder, `mipmap-${info.name}`);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
  const file = path.resolve(folder, 'ic_launcher.png');
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
  fs.writeFileSync(file, outputBuffer);
});

// Also create play store image for android 512x512
const playStoreFile = path.resolve(assetsFolder, 'launcher-play-store.png');
console.log('Storing play store icon at ', playStoreFile);
if (fs.existsSync(playStoreFile)) {
  fs.unlinkSync(playStoreFile);
}
fs.writeFileSync(playStoreFile, svg2png.sync(svg, { width: 512, height: 512 }));

