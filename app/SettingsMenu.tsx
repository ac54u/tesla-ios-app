import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SettingsMenuProps {
  visible: boolean;
  onClose: () => void;
  refreshToken: string;
  accessToken: string;
  vehicleId: string;
  // 🌟 新增接收从外面传进来的最新用户信息
  accountName: string;
  accountAvatar: string;
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
  // 🌟 使用外部传进来的数据，彻底解决缓存不更新的问题
  accountName,
  accountAvatar,
  onLogin,
  onLogout,
  onOpenMap
}: SettingsMenuProps) {

  const [showModal, setShowModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  // 侧滑全屏动画
  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShowModal(false);
      });
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={showModal}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
              <Text style={styles.headerTitle}>菜单</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
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
                <View style={styles.profileSection}>
                  {/* 🌟 实时渲染头像，如果为空则显示默认头像 */}
                  <Image
                    source={{
                      uri: accountAvatar && accountAvatar.includes('tesla.cn')
                        ? accountAvatar
                        : 'https://www.gravatar.com/avatar/0?d=mp',
                      headers: {
                        'User-Agent': 'TeslaV4/4.54.3 (com.teslamotors.TeslaApp; build:4107; iOS 17.0.0) Alamofire/5.2.1',
                        'Accept': '*/*'
                      }
                    }}
                    style={styles.avatar}
                  />
                  
                  {/* 🌟 实时渲染名字 */}
                  <Text style={styles.userName}>
                    {accountName || 'Tesla 车主'}
                  </Text>
                  <Text style={styles.userEmail}>
                    已绑定官方账号
                  </Text>
                </View>

                <View style={styles.settingsList}>
                  <TouchableOpacity style={styles.settingItem}>
                    <Ionicons name="gift-outline" size={22} color="#fff" style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTextPrimary}>引荐奖励</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.settingItem} onPress={onOpenMap}>
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

                <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                  <Text style={styles.logoutButtonText}>退出登录</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '500',
    marginLeft: 2,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 24,
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
  profileSection: {
    alignItems: 'flex-start',
    paddingVertical: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    paddingBottom: 30,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 16,
    backgroundColor: '#333'
  },
  userName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    color: '#888',
    fontSize: 14
  },
  settingsList: {
    marginTop: 10,
    marginBottom: 30
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  settingIcon: {
    marginRight: 15
  },
  settingTextContainer: {
    flex: 1
  },
  settingTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#E31937',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 20
  },
  logoutButtonText: {
    color: '#E31937',
    fontSize: 16,
    fontWeight: '600'
  }
});