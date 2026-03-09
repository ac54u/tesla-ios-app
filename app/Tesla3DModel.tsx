import { Center, useGLTF } from '@react-three/drei/native';
import { useFrame } from '@react-three/fiber/native';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Text as RNText, StyleSheet, View } from 'react-native';

export interface Tesla3DModelProps {
  setModelLoaded: (loaded: boolean) => void;
}

// 🌟 缩小版、更精致的全息交互节点
const HolographicNode = ({ position, color, label, action }: { position: any, color: string, label: string, action: () => void }) => {
  // 🌟 修复 TS 报错：给 useRef 传入初始值 null
  const diamondRef = useRef<any>(null);

  useFrame(() => {
    if (diamondRef.current) {
      diamondRef.current.rotation.y += 0.02;
      diamondRef.current.rotation.x += 0.01;
    }
  });

  return (
    <group position={position}>
      {/* 1. 缩小底座光点 */}
      <mesh>
        <sphereGeometry args={[0.015, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* 2. 缩短并改细悬浮光线 */}
      <mesh position={[0, 0.125, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.25]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>

      {/* 3. 缩小顶部的自转线框钻石 */}
      <mesh 
        ref={diamondRef}
        position={[0, 0.3, 0]} 
        onClick={(e) => { 
          e.stopPropagation(); 
          Alert.alert(label, '指令已就绪 🚀');
          action(); 
        }}
      >
        <octahedronGeometry args={[0.04, 0]} />
        <meshBasicMaterial color={color} wireframe={true} />
      </mesh>
    </group>
  );
};

export default function Tesla3DModel({ setModelLoaded }: Tesla3DModelProps) {
  const { scene } = useGLTF('https://cdn.jsdelivr.net/gh/ac54u/tesla-ios-app@main/assets/tesla_cybertruck.glb') as any;
  
  useEffect(() => { 
    setModelLoaded(true); 
  }, [setModelLoaded]);

  return (
    <group position={[0, -0.5, 0]}>
      <Center>
        <group scale={1.65} rotation={[0, -Math.PI / 2.5, 0]}>
          
          <primitive object={scene} />

          {/* 🌟 坐标大收缩！紧贴车身 🌟 */}
          
          {/* 前备箱 - 科技蓝 */}
          <HolographicNode 
            position={[0, 0.25, 1.1]} 
            color="#3B82F6" 
            label="打开前备箱 (Frunk)"
            action={() => console.log('Frunk')} 
          />
          
          {/* 后备箱 - 科技蓝 */}
          <HolographicNode 
            position={[0, 0.25, -1.1]} 
            color="#3B82F6" 
            label="打开后备箱 (Trunk)"
            action={() => console.log('Trunk')} 
          />

          {/* 车辆解锁 - 安全绿 */}
          <HolographicNode 
            position={[0.5, 0.45, 0.1]} 
            color="#10B981" 
            label="解锁车辆 (Unlock)"
            action={() => console.log('Unlock')} 
          />

          {/* 充电口 - 闪电橙 */}
          <HolographicNode 
            position={[0.5, 0.3, -0.8]} 
            color="#F59E0B" 
            label="开启充电口 (Charge Port)"
            action={() => console.log('Charge')} 
          />

        </group>
      </Center>
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
});