import React, { useEffect, useRef } from 'react';
// 🌟 核心急救：引入 Animated
import { Center, useGLTF } from '@react-three/drei/native';
import { useFrame, useThree } from '@react-three/fiber/native';
import { ActivityIndicator, Animated, Text as RNText, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as THREE from 'three';

export interface Tesla3DModelProps {
  setModelLoaded: (loaded: boolean) => void;
}

// 1. 高速事件总线
export const hudEmitter = {
  listener: null as any,
  emit(data: any) { if (this.listener) this.listener(data); },
  subscribe(fn: any) { this.listener = fn; }
};

// 🌟 2. 满血复活版：使用底层 Animated 引擎的 2D 悬浮 UI
export function HudOverlay({ actions }: { actions: any }) {
  // 使用 Animated.ValueXY 绕开 React 渲染机制，初始值放到屏幕外面隐藏起来
  const frunkPos = useRef(new Animated.ValueXY({ x: -1000, y: -1000 })).current;
  const trunkPos = useRef(new Animated.ValueXY({ x: -1000, y: -1000 })).current;
  const doorPos = useRef(new Animated.ValueXY({ x: -1000, y: -1000 })).current;
  const chargePos = useRef(new Animated.ValueXY({ x: -1000, y: -1000 })).current;

  useEffect(() => {
    // 监听 60fps 坐标，直接用 setValue 赋值到底层，性能消耗极低！
    hudEmitter.subscribe((payload: any) => {
      if (payload.frunk) frunkPos.setValue({ x: payload.frunk.x - 45, y: payload.frunk.y - 15 });
      if (payload.trunk) trunkPos.setValue({ x: payload.trunk.x - 45, y: payload.trunk.y - 15 });
      if (payload.door) doorPos.setValue({ x: payload.door.x - 45, y: payload.door.y - 15 });
      if (payload.charge) chargePos.setValue({ x: payload.charge.x - 45, y: payload.charge.y - 15 });
    });
  }, [chargePos, doorPos, frunkPos, trunkPos]);

  // 使用 Animated.View 接收底层位移
  const renderButton = (animPos: Animated.ValueXY, label: string, action: any) => (
    <Animated.View style={[styles.hudWrapper, { transform: animPos.getTranslateTransform() }]} pointerEvents="box-none">
      <TouchableOpacity style={styles.hudButton} activeOpacity={0.7} onPress={action}>
        <RNText style={styles.hudText}>{label}</RNText>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents="box-none">
      {renderButton(frunkPos, '打开前备箱', actions.frunk)}
      {renderButton(trunkPos, '打开后备箱', actions.trunk)}
      {renderButton(doorPos, '🔓 解锁', actions.door)}
      {renderButton(chargePos, '⚡ 充电口', actions.charge)}
    </View>
  );
}

// 3. 隐形计算引擎：在 3D 世界里算好像素发给 2D UI
const TrackerEngine = ({ anchors }: { anchors: any[] }) => {
  const { camera, size } = useThree();
  const vec = useRef(new THREE.Vector3());

  useFrame(() => {
    const payload: any = {};
    anchors.forEach((item) => {
      if (item.ref.current) {
        // 获取模型放大旋转后的真实世界坐标
        item.ref.current.getWorldPosition(vec.current);
        vec.current.project(camera);
        payload[item.name] = {
          x: (vec.current.x * 0.5 + 0.5) * size.width,
          y: (vec.current.y * -0.5 + 0.5) * size.height,
        };
      }
    });
    hudEmitter.emit(payload);
  });
  return null;
};

export default function Tesla3DModel({ setModelLoaded }: Tesla3DModelProps) {
  const { scene } = useGLTF('https://cdn.jsdelivr.net/gh/ac54u/tesla-ios-app@main/assets/tesla_cybertruck.glb') as any;
  
  useEffect(() => { setModelLoaded(true); }, [setModelLoaded]);

  const frunkRef = useRef<any>(null);
  const trunkRef = useRef<any>(null);
  const doorRef = useRef<any>(null);
  const chargeRef = useRef<any>(null);

  const anchors = [
    { name: 'frunk', ref: frunkRef },
    { name: 'trunk', ref: trunkRef },
    { name: 'door', ref: doorRef },
    { name: 'charge', ref: chargeRef },
  ];

  const renderAnchorLine = (ref: any, position: any, height: number) => (
    <group position={position}>
      <mesh><sphereGeometry args={[0.012, 16, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
      <mesh position={[0, height / 2, 0]}><cylinderGeometry args={[0.002, 0.002, height]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.6} /></mesh>
      {/* 极点锚点 */}
      <group ref={ref} position={[0, height, 0]} />
    </group>
  );

  return (
    <group position={[0, -0.5, 0]}>
      <group scale={1.65} rotation={[0, -Math.PI / 2.5, 0]}>
        <Center>
          <primitive object={scene} />
        </Center>

        {renderAnchorLine(frunkRef, [0, 0.35, 1.2], 0.35)}
        {renderAnchorLine(trunkRef, [0, 0.45, -1.3], 0.4)}
        {renderAnchorLine(doorRef, [0.85, 0.4, 0.1], 0.4)}
        {renderAnchorLine(chargeRef, [0.9, 0.4, -0.9], 0.3)}

        <TrackerEngine anchors={anchors} />
      </group>
    </group>
  );
}

export function FallbackLoader() {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#fff" />
      <RNText style={{ color: '#888', marginTop: 10 }}>模型解析中...</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hudWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 90, 
    alignItems: 'center',
  },
  hudButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  hudText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});