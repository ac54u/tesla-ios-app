// app/SettingsMenu.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface SettingsMenuProps {
  visible: boolean;
  onClose: () => void;
  refreshToken: string;
  accessToken: string;
  vehicleId: string;
  onLogin: () => void;
  onLogout: () => void;
  onOpenMap: () => void;
}

export default function SettingsMenu({
  visible,
  onClose,
  refreshToken,
  accessToken,
  vehicleId,
  onLogin,
  onLogout,
  onOpenMap
}: SettingsMenuProps) {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);

const fetchUserInfo = async (currentAccess: string) => {
    if (!currentAccess) return;
    setLoadingUser(true);
    try {
      // 👇 关键改动 1：在网址后面偷偷加一个随机的时间戳，让系统认为每次请求的都是一个"新"网址
      const timestamp = new Date().getTime();
      const res = await fetch(`https://auth.tesla.cn/oauth2/v3/userinfo?_t=${timestamp}`, {
        headers: { 
          Authorization: `Bearer ${currentAccess}`,
          // 👇 关键改动 2：强制要求服务器和手机本地都不许使用缓存
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await res.json();
      
      if (res.ok) {
        setUserInfo({
          full_name: data.name || data.full_name || 'Tesla 车主',
          email: data.email || '已隐藏邮箱',
          profile_image_url: data.picture || data.profile_image_url || 'https://www.gravatar.com/avatar/0?d=mp&f=y'
        });
      } else {
        setUserInfo({ 
          full_name: 'Tesla 车主', 
          email: data.error_description || data.error || '获取资料受限，请重新登录',
          profile_image_url: 'https://www.gravatar.com/avatar/0?d=mp&f=y'
        });
      }
    } catch (error) {
      setUserInfo({ full_name: 'Tesla 车主', email: '网络请求失败', profile_image_url: 'https://www.gravatar.com/avatar/0?d=mp' });
    } finally {
      setLoadingUser(false);
    }
  };

useEffect(() => {
    if (visible) {
      if (accessToken) {
        // 去掉了 !userInfo 的限制，现在每次打开面板都会拉取最新数据
        fetchUserInfo(accessToken);
      } else {
        setUserInfo({ full_name: '同步中...', email: '请稍后重试' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, accessToken]);

  const handleOpenMap = () => {
    if (!vehicleId) {
      Alert.alert('提示', '请先等待车辆数据加载完成');
      return;
    }
    onOpenMap();
  };

  return (
    <Modal 
      animationType="slide" 
      transparent={Platform.OS === 'android'} // Android 保持透明背景以实现半屏，iOS 使用 pageSheet
      visible={visible} 
      onRequestClose={onClose}
      // 👇 这里是关键：在 iOS 上使用 formSheet/pageSheet 可以原生支持下拉关闭和类似图二的阴影层级
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          {/* 👇 顶部小灰线拖拽指示器 */}
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          <View style={styles.modalHeader}>
            {/* 左侧下拉按钮 (仿图二样式) */}
            <TouchableOpacity onPress={onClose} style={styles.closeButtonLeft}>
               <Ionicons name="chevron-down" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>账号与设置</Text>
            
            {/* 右侧占位，保证标题绝对居中 */}
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {!refreshToken ? (
              <View style={styles.unauthView}>
                <Ionicons name="person-circle-outline" size={80} color="#444" />
                <Text style={styles.unauthText}>您尚未登录特斯拉账号</Text>
                <TouchableOpacity style={styles.buttonAuthRed} onPress={onLogin}>
                  <Text style={styles.buttonTextWhiteLarge}>去登录</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.profileCard}>
                  {loadingUser ? (
                    <ActivityIndicator size="small" color="#fff" style={{ marginVertical: 20 }} />
                  ) : (
                    <>
                      <Image source={{ uri: userInfo?.profile_image_url || 'https://www.gravatar.com/avatar/0?d=mp' }} style={styles.avatar} />
                      <Text style={styles.userName}>{userInfo?.full_name || 'Tesla 车主'}</Text>
                      <Text style={styles.userEmail} numberOfLines={1}>{userInfo?.email || '未知邮箱'}</Text>
                    </>
                  )}
                </View>
                
                {/* 👇 调整了列表项的圆角和边距，更贴近图二独立卡片的感觉 */}
                <View style={styles.settingsList}>
                  <TouchableOpacity style={styles.settingItem}>
                    <Ionicons name="gift-outline" size={22} color="#fff" style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTextPrimary}>引荐奖励</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.settingItem} onPress={handleOpenMap}>
                    <Ionicons name="location-outline" size={22} color="#10B981" style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTextPrimary}>附近超级充电站</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.settingItem, styles.settingItemNoBorder]}>
                    <Ionicons name="shield-checkmark-outline" size={22} color="#fff" style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTextPrimary}>隐私与安全</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                  <Text style={styles.logoutButtonText}>退出登录</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // iOS 上的 pageSheet 自带背景，所以这里把背景改成了纯黑，以契合整体 UI
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Platform.OS === 'ios' ? '#111' : 'rgba(0, 0, 0, 0.6)' },
  modalContent: { 
    backgroundColor: '#111', 
    borderTopLeftRadius: Platform.OS === 'ios' ? 0 : 24, 
    borderTopRightRadius: Platform.OS === 'ios' ? 0 : 24, 
    flex: Platform.OS === 'ios' ? 1 : undefined,
    height: Platform.OS === 'ios' ? '100%' : '90%', 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 40 
  },
  
  // 👇 顶部拖拽小灰线样式
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#444', // 深灰线条
    borderRadius: 2,
  },

  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingBottom: 15, 
    marginBottom: 20 
  },
  
  // 👇 改为左侧方形深灰背景按钮
  closeButtonLeft: { 
    width: 40,
    height: 40,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },

  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '500' },
  modalBody: { flex: 1 },
  
  unauthView: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  unauthText: { color: '#888', fontSize: 16, marginTop: 15, marginBottom: 30 },
  buttonAuthRed: { backgroundColor: '#E31937', paddingVertical: 16, width: '100%', borderRadius: 50, alignItems: 'center', marginTop: 10 },
  buttonTextWhiteLarge: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  
  profileCard: { 
    alignItems: 'center', 
    backgroundColor: '#1C1C1E', 
    borderRadius: 16, 
    paddingVertical: 35, 
    marginBottom: 20 
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 15, backgroundColor: '#333' },
  userName: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 5 },
  userEmail: { color: '#888', fontSize: 13, textAlign: 'center', paddingHorizontal: 10 },
  
  // 👇 列表样式调整：去掉副标题，间距更大，接近官方菜单
  settingsList: { marginBottom: 30 },
  settingItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1C1C1E', // 独立卡片背景
    paddingVertical: 18, 
    paddingHorizontal: 15, 
    borderRadius: 12,
    marginBottom: 10 // 卡片之间有缝隙
  },
  settingItemNoBorder: {
    marginBottom: 0
  },
  settingIcon: { marginRight: 15 },
  settingTextContainer: { flex: 1, justifyContent: 'center' },
  settingTextPrimary: { color: '#fff', fontSize: 15, fontWeight: '400' },
  
  // 👇 退出按钮改为红边黑底，更克制
  logoutButton: { 
    backgroundColor: 'transparent', 
    borderWidth: 1, 
    borderColor: '#E31937', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  logoutButtonText: { color: '#E31937', fontSize: 15, fontWeight: '500' },
});