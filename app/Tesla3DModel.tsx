import { Center, useGLTF } from '@react-three/drei/native';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Text as RNText, StyleSheet, View } from 'react-native';
// 🌟 引入 useFrame 让我们的全息节点转起来！
import { useFrame } from '@react-three/fiber/native';

export interface Tesla3DModelProps {
  setModelLoaded: (loaded: boolean) => void;
}

// 🌟 赛博朋克风：全息交互节点
const HolographicNode = ({ position, color, label, action }: { position: any, color: string, label: string, action: () => void }) => {
  // 🌟 修复点：加上 null 作为初始值，满足严格模式的 TypeScript 要求
  const diamondRef = useRef<any>(null);

  // 每一帧都让顶部的钻石旋转一点点，形成极其炫酷的科技感
  useFrame(() => {
    if (diamondRef.current) {
      diamondRef.current.rotation.y += 0.02;
      diamondRef.current.rotation.x += 0.01;
    }
  });

  return (
    <group position={position}>
      {/* 1. 贴在车身上的能量底座 */}
      <mesh>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* 2. 悬浮光线 */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.8]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>

      {/* 3. 顶部的自转线框钻石 (点击触发器) */}
      <mesh 
        ref={diamondRef}
        position={[0, 0.8, 0]} 
        onClick={(e) => { 
          e.stopPropagation(); 
          Alert.alert(label, '指令已就绪 🚀');
          action(); 
        }}
      >
        {/* 八面体 (钻石形状), 0代表最简锐利的线条 */}
        <octahedronGeometry args={[0.12, 0]} />
        {/* wireframe=true 开启线框模式，科技感拉满！ */}
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

          {/* 🌟 放置我们的全息节点，用颜色区分功能 🌟 */}
          
          {/* 前备箱 - 科技蓝 */}
          <HolographicNode 
            position={[0, 0.7, 2.0]} 
            color="#3B82F6" 
            label="打开前备箱 (Frunk)"
            action={() => console.log('Frunk')} 
          />
          
          {/* 后备箱 - 科技蓝 */}
          <HolographicNode 
            position={[0, 0.8, -2.2]} 
            color="#3B82F6" 
            label="打开后备箱 (Trunk)"
            action={() => console.log('Trunk')} 
          />

          {/* 车辆解锁 - 安全绿 */}
          <HolographicNode 
            position={[1.0, 1.0, 0.2]} 
            color="#10B981" 
            label="解锁车辆 (Unlock)"
            action={() => console.log('Unlock')} 
          />

          {/* 充电口 - 闪电橙 */}
          <HolographicNode 
            position={[1.0, 0.6, -1.6]} 
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