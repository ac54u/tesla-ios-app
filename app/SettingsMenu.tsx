import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { fetchTeslaUser, getCachedUser } from '../services/userService';

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

  const refreshUser = async () => {
    if (!accessToken) return;

    setLoadingUser(true);

    try {
      const user = await fetchTeslaUser(accessToken);
      setUserInfo(user);
    } catch (e) {
      console.log('userinfo error', e);
    } finally {
      setLoadingUser(false);
    }
  };

  // 先加载缓存
  useEffect(() => {
    const loadCache = async () => {
      const cache = await getCachedUser();
      if (cache) setUserInfo(cache);
    };

    if (visible) loadCache();
  }, [visible]);

  // 打开页面刷新 Tesla
  useEffect(() => {
    if (visible && accessToken) {
      refreshUser();
    }
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
      transparent={Platform.OS === 'android'}
      visible={visible}
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>

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

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loadingUser}
                onRefresh={refreshUser}
                tintColor="#fff"
              />
            }
          >

            {!refreshToken ? (

              <View style={styles.unauthView}>
                <Ionicons name="person-circle-outline" size={80} color="#444" />
                <Text style={styles.unauthText}>您尚未登录特斯拉账号</Text>

                <TouchableOpacity
                  style={styles.buttonAuthRed}
                  onPress={onLogin}
                >
                  <Text style={styles.buttonTextWhiteLarge}>去登录</Text>
                </TouchableOpacity>

              </View>

            ) : (

              <View>

                <View style={styles.profileCard}>

                  {loadingUser && !userInfo ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Image
                        source={{
                          uri:
                            userInfo?.profile_image_url ||
                            'https://www.gravatar.com/avatar/0?d=mp'
                        }}
                        style={styles.avatar}
                      />

                      <Text style={styles.userName}>
                        {userInfo?.full_name || 'Tesla 车主'}
                      </Text>

                      <Text style={styles.userEmail}>
                        {userInfo?.email || '未知邮箱'}
                      </Text>
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

                  <TouchableOpacity
                    style={styles.settingItem}
                    onPress={handleOpenMap}
                  >
                    <Ionicons name="location-outline" size={22} color="#10B981" style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTextPrimary}>附近超级充电站</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.settingItem}>
                    <Ionicons name="shield-checkmark-outline" size={22} color="#fff" style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTextPrimary}>隐私与安全</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>

                </View>

                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={onLogout}
                >
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

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor:
      Platform.OS === 'ios'
        ? '#111'
        : 'rgba(0,0,0,0.6)'
  },

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
    paddingVertical: 8
  },

  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },

  modalBody: {
    flex: 1
  },

  unauthView: {
    alignItems: 'center',
    marginTop: 60
  },

  unauthText: {
    color: '#888',
    marginTop: 15,
    marginBottom: 30
  },

  buttonAuthRed: {
    backgroundColor: '#E31937',
    paddingVertical: 16,
    width: '100%',
    borderRadius: 50,
    alignItems: 'center'
  },

  buttonTextWhiteLarge: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },

  profileCard: {
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingVertical: 35,
    marginBottom: 20
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
    backgroundColor: '#333'
  },

  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },

  userEmail: {
    color: '#888',
    fontSize: 13
  },

  settingsList: {
    marginBottom: 30
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 10
  },

  settingIcon: {
    marginRight: 15
  },

  settingTextContainer: {
    flex: 1
  },

  settingTextPrimary: {
    color: '#fff',
    fontSize: 15
  },

  logoutButton: {
    borderWidth: 1,
    borderColor: '#E31937',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },

  logoutButtonText: {
    color: '#E31937',
    fontSize: 15
  }

});