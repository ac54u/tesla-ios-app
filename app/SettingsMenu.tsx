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

  // 👇 重写后的核心函数：先强制刷新 token，再拉取最新资料（彻底解决 Tesla 服务器缓存）
  const fetchUserInfo = async (currentRefresh: string) => {
    if (!currentRefresh) return;
    
    setLoadingUser(true);
    
    try {
      console.log('🔄 正在用 refreshToken 强制刷新 accessToken...');

      // 第一步：强制刷新 token（Tesla 服务器会返回最新账号状态）
      const refreshRes = await fetch('https://auth.tesla.cn/oauth2/v3/token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: 'ownerapi',           // ← 如果你登录时用了其他 client_id（比如 tesla-app），请改这里
          refresh_token: currentRefresh,
          scope: 'openid email offline_access'
        })
      });

      const refreshData = await refreshRes.json();
      
      if (!refreshRes.ok) {
        throw new Error('刷新 token 失败: ' + (refreshData.error_description || refreshData.error || '未知错误'));
      }

      const newAccessToken = refreshData.access_token;
      console.log('✅ Token 刷新成功！使用新 token 拉取最新资料');

      // 第二步：用刚刚刷新的新 token 去拉 userinfo（必能拿到最新名字/头像）
      const timestamp = new Date().getTime();
      const res = await fetch(`https://auth.tesla.cn/oauth2/v3/userinfo?_t=${timestamp}`, {
        headers: { 
          Authorization: `Bearer ${newAccessToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      const data = await res.json();
      console.log('📋 userinfo 返回数据:', data);   // ← 调试用！改名字后看这里 name 是否更新

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
    } catch (error: any) {
      console.error('❌ 获取用户资料失败:', error.message);
      setUserInfo({ 
        full_name: 'Tesla 车主', 
        email: '网络请求失败，请重新登录',
        profile_image_url: 'https://www.gravatar.com/avatar/0?d=mp'
      });
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    if (visible) {
      if (refreshToken) {
        // 每次打开菜单都强制刷新 token + 拉最新资料
        fetchUserInfo(refreshToken);
      } else {
        setUserInfo({ full_name: '同步中...', email: '请稍后重试' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, refreshToken]);

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
      transparent={Platform.OS === 'android'}
      visible={visible} 
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          {/* 顶部小灰线拖拽指示器 */}
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonLeft}>
               <Ionicons name="chevron-down" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>账号与设置</Text>
            
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
  
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
  },

  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingBottom: 15, 
    marginBottom: 20 
  },
  
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
  
  settingsList: { marginBottom: 30 },
  settingItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1C1C1E',
    paddingVertical: 18, 
    paddingHorizontal: 15, 
    borderRadius: 12,
    marginBottom: 10
  },
  settingItemNoBorder: {
    marginBottom: 0
  },
  settingIcon: { marginRight: 15 },
  settingTextContainer: { flex: 1, justifyContent: 'center' },
  settingTextPrimary: { color: '#fff', fontSize: 15, fontWeight: '400' },
  
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