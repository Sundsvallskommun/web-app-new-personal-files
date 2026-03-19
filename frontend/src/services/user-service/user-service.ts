import { ApiResponse, apiService } from '../api-service';
import { createWithEqualityFn } from 'zustand/traditional';
import { devtools } from 'zustand/middleware';
import { __DEV__ } from '@sk-web-gui/react';
import { emptyUser } from './defaults';
import { ServiceResponse } from '@interfaces/services';
import { User } from '@data-contracts/backend/data-contracts';
import { apiURL } from '@utils/api-url';

const handleSetUserResponse: (res: ApiResponse<User>) => User = (res) => ({
  personId: res.data.personId,
  email: res.data.email,
  name: res.data.name,
  username: res.data.username,
  givenName: res.data.givenName,
  surname: res.data.surname,
  permissions: res.data.permissions,
  role: res.data.role,
  groups: res.data.groups,
});

const getMe: () => Promise<ServiceResponse<User>> = () => {
  return apiService
    .get<ApiResponse<User>>('me')
    .then((res) => ({ data: handleSetUserResponse(res.data) }))
    .catch((e) => ({
      message: e.response?.data.message,
      error: e.response?.status ?? 'UNKNOWN ERROR',
    }));
};
const getAvatar: () => Promise<ServiceResponse<string>> = () => {
  return apiService
    .get<ApiResponse<string>>('user/avatar?width=44')
    .then(() => ({ data: apiURL(`/user/avatar?width=44`) }))
    .catch(() => ({
      data: '',
    }));
};

interface State {
  user: User;
  avatar: string;
}
interface Actions {
  setUser: (user: User) => void;
  getMe: () => Promise<ServiceResponse<User>>;
  getAvatar: () => Promise<ServiceResponse<string>>;
  reset: () => void;
}

const initialState: State = {
  user: emptyUser,
  avatar: '',
};

export const useUserStore = createWithEqualityFn<State & Actions>()(
  devtools(
    (set, get) => ({
      ...initialState,
      setUser: (user) => set(() => ({ user })),
      getMe: async () => {
        let user: User | undefined = get().user;
        const res = await getMe();
        if (!res.error) {
          user = res.data;
          set(() => ({ user: user }));
        }
        return { data: user };
      },
      getAvatar: async () => {
        let avatar: string | undefined = get().avatar;
        const res = await getAvatar();
        if (!res.error) {
          avatar = res.data;
          set(() => ({ avatar: avatar }));
        }
        return { data: avatar };
      },
      reset: () => {
        set(initialState);
      },
    }),
    { enabled: __DEV__ }
  )
);
