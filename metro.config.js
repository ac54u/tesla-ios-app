const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 将 3D 模型后缀名加入到 Metro 打包器的资源扩展名列表中
config.resolver.assetExts.push(
  'glb',
  'gltf',
  'png',
  'jpg'
);

module.exports = config;