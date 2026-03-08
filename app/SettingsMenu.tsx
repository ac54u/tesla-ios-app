// app/SettingsMenu.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
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

  useEffect(() => {
    if (visible) {
      if (accessToken && !userInfo) {
        fetchUserInfo(accessToken);
      } else if (!accessToken) {
        setUserInfo({ full_name: '同步中...', email: '请稍后重试' });
      }
    }
  }, [visible, accessToken]);

  const fetchUserInfo = async (currentAccess: string) => {
    if (!currentAccess) return;
    setLoadingUser(true);
    try {
      const res = await fetch('https://auth.tesla.cn/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${currentAccess}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setUserInfo({
          full_name: data.name || data.full_name || 'Tesla 车主',
          email: data.email || '已隐藏邮箱',
          profile_image_url: data.picture || data.profile_image_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
        });
      } else {
        setUserInfo({ 
          full_name: 'Tesla 车主', 
          email: data.error_description || data.error || '获取资料受限，请重新登录',
          profile_image_url: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
        });
      }
    } catch (error) {
      setUserInfo({ full_name: 'Tesla 车主', email: '网络请求失败', profile_image_url: 'https://www.gravatar.com/avatar/0?d=mp' });
    } finally {
      setLoadingUser(false);
    }
  };

  const handleOpenMap = () => {
    if (!vehicleId) {
      Alert.alert('提示', '请先等待车辆数据加载完成');
      return;
    }
    onOpenMap();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>账号与设置</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
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
                  <View style={styles.settingItem}>
                    <Ionicons name="gift-outline" size={22} color="#fff" style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTextPrimary}>引荐奖励</Text>
                      <Text style={styles.settingTextSecondary}>分享您的引荐链接获取积分</Text>
                    </View> {/* <--- 改回 </View> */}
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </View>
                  
                  <TouchableOpacity style={styles.settingItem} onPress={handleOpenMap}>
                    <Ionicons name="location-outline" size={22} color="#10B981" style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTextPrimary}>附近超级充电站</Text>
                      <Text style={styles.settingTextSecondary}>查看您车辆周边的可用超充</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                  
                  <View style={styles.settingItem}>
                    <Ionicons name="shield-checkmark-outline" size={22} color="#fff" style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTextPrimary}>隐私与安全</Text>
                      <Text style={styles.settingTextSecondary}>API 访问权限与数据管理</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </View>
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
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222', marginBottom: 10 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeButton: { padding: 4 },
  modalBody: { flex: 1 },
  unauthView: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  unauthText: { color: '#888', fontSize: 16, marginTop: 15, marginBottom: 30 },
  buttonAuthRed: { backgroundColor: '#E31937', paddingVertical: 16, width: '100%', borderRadius: 50, alignItems: 'center', marginTop: 10 },
  buttonTextWhiteLarge: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  profileCard: { alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 20, paddingVertical: 30, marginBottom: 20 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 15, borderWidth: 2, borderColor: '#333' },
  userName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  userEmail: { color: '#888', fontSize: 12, textAlign: 'center', paddingHorizontal: 10 },
  settingsList: { backgroundColor: '#1C1C1E', borderRadius: 16, marginBottom: 30 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  settingIcon: { marginRight: 15 },
  settingTextContainer: { flex: 1 },
  settingTextPrimary: { color: '#fff', fontSize: 16, fontWeight: '500', marginBottom: 3 },
  settingTextSecondary: { color: '#888', fontSize: 12 },
  logoutButton: { backgroundColor: 'rgba(227, 25, 55, 0.1)', borderWidth: 1, borderColor: '#E31937', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 20 },
  logoutButtonText: { color: '#E31937', fontSize: 16, fontWeight: '600' },
});