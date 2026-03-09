import { Center, useGLTF } from '@react-three/drei/native';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, Text as RNText, StyleSheet, View } from 'react-native';

export interface Tesla3DModelProps {
  setModelLoaded: (loaded: boolean) => void;
}

// 🌟 抢救版：去除了致命的 3D Text，使用 100% 安全的纯几何体
const TeslaLineHud = ({ position, height = 0.4, action }: { position: any, height?: number, action: () => void }) => {
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); action(); }}>
      
      {/* 1. 紧贴车身表面的锚点 (发光小圆点) */}
      <mesh>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* 2. 垂直向上的连线 */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.002, 0.002, height]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>

      {/* 3. 顶部的全息交互圆环 (代替会导致闪退的中文) */}
      <mesh position={[0, height, 0]}>
        {/* torusGeometry: 甜甜圈形状 [圆环半径, 管道半径, 管壁分段, 圆环分段] */}
        <torusGeometry args={[0.04, 0.004, 16, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 4. 隐形碰撞箱：放在圆环位置，放大点击区域，防止手指点不准 */}
      <mesh position={[0, height, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
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
      <group scale={1.65} rotation={[0, -Math.PI / 2.5, 0]}>
        
        <Center>
          <primitive object={scene} />
        </Center>

        {/* 前备箱 */}
        <TeslaLineHud 
          position={[0, 0.35, 1.2]} 
          height={0.35}
          action={() => Alert.alert('前备箱', '正在开启...')} 
        />
        
        {/* 后备箱 */}
        <TeslaLineHud 
          position={[0, 0.45, -1.3]} 
          height={0.4}
          action={() => Alert.alert('后备箱', '正在开启...')} 
        />

        {/* 左侧车门 */}
        <TeslaLineHud 
          position={[0.85, 0.4, 0.1]} 
          height={0.4}
          action={() => Alert.alert('车门', '车辆已解锁')} 
        />

        {/* 左后充电口 */}
        <TeslaLineHud 
          position={[0.9, 0.4, -0.9]} 
          height={0.3}
          action={() => Alert.alert('充电口', '正在打开充电口盖')} 
        />

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
});