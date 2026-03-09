// app/SettingsMenu.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch, 
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// 🌟 引入 insets 替代 SafeAreaView
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SettingsMenuProps {
  visible: boolean;
  onClose: () => void;
  refreshToken: string;
  accessToken: string;
  vehicleId: string;
  accountName: string;
  accountAvatar: string;
  accountEmail: string; 
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
  accountName,
  accountAvatar,
  accountEmail,
  onLogin,
  onLogout,
  onOpenMap
}: SettingsMenuProps) {

  // 🌟 获取安全距离
  const insets = useSafeAreaInsets();

  const [showModal, setShowModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  const [showAccountPage, setShowAccountPage] = useState(false);
  const accountSlideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  
  const [clipboardEnabled, setClipboardEnabled] = useState(true);

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
        setShowAccountPage(false); 
      });
    }
  }, [visible, slideAnim]);

  useEffect(() => {
    Animated.timing(accountSlideAnim, {
      toValue: showAccountPage ? 0 : SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [showAccountPage, accountSlideAnim]);

  const renderAccountMenuItem = (iconName: keyof typeof Ionicons.glyphMap, title: string) => (
    <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
      <Ionicons name={iconName} size={22} color="#C4C7C5" style={styles.settingIcon} />
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTextPrimary}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8E918F" />
    </TouchableOpacity>
  );

  return (
    <Modal
      transparent
      visible={showModal}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.fullScreenWrapper}>
        
        {/* ======================= 一级菜单 ======================= */}
        <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
          {/* 🌟 核心修改：普通 View 加上动态上下边距 */}
          <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={28} color="#E3E3E3" />
                <Text style={styles.headerTitle}>菜单</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} bounces={false}>
              {!refreshToken ? (
                <View style={styles.unauthView}>
                  <Ionicons name="person-circle-outline" size={80} color="#8E918F" />
                  <Text style={styles.unauthText}>您尚未登录特斯拉账号</Text>
                  <TouchableOpacity style={styles.buttonAuthRed} onPress={onLogin}>
                    <Text style={styles.buttonTextWhiteLarge}>去登录</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <TouchableOpacity style={styles.profileSection} activeOpacity={0.8} onPress={() => setShowAccountPage(true)}>
                    <Image
                      source={{
                        uri: accountAvatar ? accountAvatar : 'https://www.gravatar.com/avatar/0?d=mp',
                        headers: { 'User-Agent': 'TeslaV4/4.54.3' }
                      }}
                      style={styles.avatar}
                    />
                    
                    <View style={styles.profileInfo}>
                      <Text style={styles.userName}>
                        {accountName || 'Tesla 车主'}
                      </Text>
                      <Text style={styles.userEmail}>
                        {accountEmail}
                      </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color="#8E918F" />
                  </TouchableOpacity>

                  <View style={styles.settingsList}>
                    <TouchableOpacity style={styles.settingItem}>
                      <Ionicons name="gift-outline" size={22} color="#C4C7C5" style={styles.settingIcon} />
                      <View style={styles.settingTextContainer}>
                        <Text style={styles.settingTextPrimary}>引荐奖励</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#8E918F" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem} onPress={onOpenMap}>
                      <Ionicons name="location-outline" size={22} color="#81C995" style={styles.settingIcon} />
                      <View style={styles.settingTextContainer}>
                        <Text style={styles.settingTextPrimary}>附近超级充电站</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#8E918F" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                      <Ionicons name="shield-checkmark-outline" size={22} color="#C4C7C5" style={styles.settingIcon} />
                      <View style={styles.settingTextContainer}>
                        <Text style={styles.settingTextPrimary}>隐私与安全</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#8E918F" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </Animated.View>

        {/* ======================= 二级页面 (账户信息) ======================= */}
        <Animated.View 
          style={[styles.accountPageContainer, { transform: [{ translateX: accountSlideAnim }] }]}
        >
          {/* 🌟 核心修改：普通 View 加上动态上下边距 */}
          <View style={{ flex: 1, justifyContent: 'space-between', paddingTop: insets.top, paddingBottom: insets.bottom }}>
            
            <View>
              <View style={styles.subHeader}>
                <TouchableOpacity onPress={() => setShowAccountPage(false)} style={styles.subHeaderLeftBtn}>
                  <Ionicons name="chevron-back" size={28} color="#E3E3E3" />
                </TouchableOpacity>
                <Text style={styles.subHeaderTitle}>{accountName || 'Tesla 车主'}</Text>
                <View style={styles.subHeaderRightPlaceholder} />
              </View>

              <ScrollView style={styles.subModalBody} showsVerticalScrollIndicator={false} bounces={false}>
                
                <View style={styles.centerProfileSection}>
                  <View style={styles.centerAvatarWrapper}>
                    <Image
                      source={{
                        uri: accountAvatar ? accountAvatar : 'https://www.gravatar.com/avatar/0?d=mp',
                        headers: { 'User-Agent': 'TeslaV4/4.54.3' }
                      }}
                      style={styles.centerAvatar}
                    />
                    <View style={styles.editBadge}>
                      <Ionicons name="pencil" size={14} color="#E3E3E3" />
                    </View>
                  </View>
                </View>

                <View style={styles.settingsList}>
                  {renderAccountMenuItem('id-card-outline', '账户信息')}
                  {renderAccountMenuItem('notifications-outline', '通知')}
                  {renderAccountMenuItem('card-outline', '卡包')}
                  {renderAccountMenuItem('shirt-outline', '订单历史记录')}
                  {renderAccountMenuItem('shield-checkmark-outline', '安全和隐私')}
                  {renderAccountMenuItem('person-circle-outline', 'Tesla设定')}
                  {renderAccountMenuItem('receipt-outline', '开发票')}
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchTextContainer}>
                    <Text style={styles.settingTextPrimary}>启动时读取剪贴板</Text>
                    <Text style={styles.settingTextSecondary}>检测剪贴板上的可共享信息</Text>
                  </View>
                  <Switch 
                    value={clipboardEnabled} 
                    onValueChange={setClipboardEnabled} 
                    trackColor={{ false: '#3E3E3E', true: '#81C995' }} 
                    thumbColor="#E3E3E3"
                  />
                </View>

              </ScrollView>
            </View>

            <TouchableOpacity style={styles.bottomLogoutBtn} onPress={onLogout} activeOpacity={0.6}>
              <Text style={styles.bottomLogoutText}>登出</Text>
            </TouchableOpacity>

          </View>
        </Animated.View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenWrapper: {
    flex: 1,
  },
  menuContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#131314',
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
    color: '#E3E3E3', 
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
    color: '#C4C7C5', 
    marginTop: 15,
    marginBottom: 30
  },
  buttonAuthRed: {
    backgroundColor: '#B3261E', 
    paddingVertical: 16,
    width: '100%',
    borderRadius: 50,
    alignItems: 'center'
  },
  buttonTextWhiteLarge: {
    color: '#E3E3E3', 
    fontSize: 18,
    fontWeight: '700'
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: '#262626', 
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E1F22'
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center'
  },
  userName: {
    color: '#E3E3E3', 
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    color: '#888888', 
    fontSize: 13
  },
  settingsList: {
    marginTop: 10,
    marginBottom: 10
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: '#262626', 
  },
  settingIcon: {
    marginRight: 15
  },
  settingTextContainer: {
    flex: 1
  },
  settingTextPrimary: {
    color: '#E3E3E3', 
    fontSize: 16,
    fontWeight: '500'
  },

  accountPageContainer: {
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: '#131314', 
    zIndex: 10,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 20,
  },
  subHeaderLeftBtn: {
    padding: 5,
    width: 40,
  },
  subHeaderTitle: {
    color: '#E3E3E3',
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  subHeaderRightPlaceholder: {
    width: 40, 
  },
  subModalBody: {
    paddingHorizontal: 24,
  },
  centerProfileSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  centerAvatarWrapper: {
    position: 'relative',
  },
  centerAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1E1F22'
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#444746', 
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#131314', 
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  settingTextSecondary: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
  },
  bottomLogoutBtn: {
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 10 : 30,
  },
  bottomLogoutText: {
    color: '#C4C7C5',
    fontSize: 15,
    fontWeight: '500'
  }
});
