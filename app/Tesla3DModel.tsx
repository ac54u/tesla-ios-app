import { Center, useGLTF } from '@react-three/drei/native';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native'; // 👈 增加了 Alert

export interface Tesla3DModelProps {
  setModelLoaded: (loaded: boolean) => void;
}

// 默认导出 3D 车辆模型组件
export default function Tesla3DModel({ setModelLoaded }: Tesla3DModelProps) {
  const { scene } = useGLTF('https://cdn.jsdelivr.net/gh/ac54u/tesla-ios-app@main/assets/tesla_cybertruck.glb') as any;
  
  useEffect(() => { 
    setModelLoaded(true); 
  }, [setModelLoaded]);

  return (
    <group position={[0, -0.5, 0]}>
      <Center>
        {/* 🌟 核心修改：用一个 group 把车和碰撞箱包起来，统一缩放和旋转 */}
        <group scale={1.65} rotation={[0, -Math.PI / 2.5, 0]}>
          
          {/* 原本的车体（纯展示，不绑事件，绝对不卡） */}
          <primitive object={scene} />

          {/* 🌟 核心科技：左驾驶门专属碰撞箱 (Hitbox) 🌟 */}
          <mesh 
            // position = [左右(X), 上下(Y), 前后(Z)] 
            // 这是一个预估的左前门坐标，你可以根据打包后红块显示的位置来修改这三个数字微调
            position={[1.0, 0.9, 0.2]} 
            onClick={(e) => {
              e.stopPropagation(); // 防止事件穿透到后面
              Alert.alert('空间触控触发！', '正在准备发送解锁左侧车门指令... 🔓');
            }}
          >
            {/* args = [宽度(X), 高度(Y), 长度(Z)] */}
            <boxGeometry args={[0.2, 0.8, 1.2]} />
            {/* 调试模式：半透明红色。等你确认位置完美对齐后，把 opacity 改成 0 即可完全隐形！ */}
            <meshBasicMaterial color="red" transparent={true} opacity={0.5} />
          </mesh>

        </group>
      </Center>
    </group>
  );
}

// 命名导出 加载动画组件
export function FallbackLoader() {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={{ color: '#888', marginTop: 10 }}>模型解析中...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});