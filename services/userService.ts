import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_CACHE_KEY = 'tesla_user_cache';

export interface TeslaUser {
  full_name: string;
  email: string;
  profile_image_url: string;
}

// 读取缓存
export async function getCachedUser(): Promise<TeslaUser | null> {
  try {
    const cache = await AsyncStorage.getItem(USER_CACHE_KEY);
    if (!cache) return null;
    return JSON.parse(cache);
  } catch {
    return null;
  }
}

// 请求 Tesla userinfo
export async function fetchTeslaUser(accessToken: string): Promise<TeslaUser> {
  const timestamp = Date.now();

  // 👇 换回特斯拉标准的 OAuth 通用获取用户信息接口
  const res = await fetch(
    `https://auth.tesla.cn/oauth2/v3/userinfo?_t=${timestamp}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0'
      }
    }
  );

  const data = await res.json();

  // 标准接口的数据直接在 data 第一层
  const user: TeslaUser = {
    full_name: data.name || data.full_name || 'Tesla 车主',
    email: data.email || '已隐藏邮箱',
    profile_image_url:
      data.picture ||
      data.profile_image_url ||
      'https://www.gravatar.com/avatar/0?d=mp'
  };

  await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));

  return user;
}
