import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { authApi } from '../api/services';
import { homeRouteByRole } from '../config/navigation';
import type { UsersLoginDTO, UsersLoginVO } from '../types/api';

interface UserProfile {
  username?: string;
  userNumber?: string;
  realName?: string;
}

interface AuthState {
  token: string;
  profile: UserProfile | null;
  role: string;
}

const STORAGE_KEY = 'code-grader-auth';

const loadStoredAuth = (): AuthState | null => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

export const useAuthStore = defineStore('auth', () => {
  const stored = loadStoredAuth();
  const token = ref(stored?.token || '');
  const profile = ref<UserProfile | null>(stored?.profile || null);
  const role = ref(stored?.role || '');

  const isAuthenticated = computed(() => Boolean(token.value && role.value));
  const displayName = computed(
    () => profile.value?.realName || profile.value?.username || '未登录',
  );

  const persist = () => {
    const payload: AuthState = {
      token: token.value,
      profile: profile.value,
      role: role.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    if (token.value) {
      localStorage.setItem('code-grader-token', token.value);
    } else {
      localStorage.removeItem('code-grader-token');
    }
  };

  const login = async (loginRole: string, payload: UsersLoginDTO) => {
    token.value = '';
    profile.value = null;
    role.value = '';
    persist();
    const data: UsersLoginVO = await authApi.login(loginRole, payload);
    token.value = data?.token || '';
    profile.value = {
      username: data?.username,
      userNumber: data?.userNumber,
    };
    role.value = loginRole;
    persist();
    return homeRouteByRole[loginRole as keyof typeof homeRouteByRole];
  };

  const updateProfile = (nextProfile: Partial<UserProfile>) => {
    profile.value = { ...profile.value, ...nextProfile };
    persist();
  };

  const logout = () => {
    token.value = '';
    profile.value = null;
    role.value = '';
    persist();
  };

  // 初始化时确保持久化
  persist();

  return {
    token,
    profile,
    role,
    isAuthenticated,
    displayName,
    login,
    updateProfile,
    logout,
  };
});
