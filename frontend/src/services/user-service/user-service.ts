import { ApiResponse, apiService } from '../api-service';
import { createWithEqualityFn } from 'zustand/traditional';
import { devtools } from 'zustand/middleware';
import { __DEV__ } from '@sk-web-gui/react';
import { emptyUser } from './defaults';
import { ServiceResponse } from '@interfaces/services';
import { User } from '@data-contracts/backend/data-contracts';
import { Employee, PortalPersonData } from '@interfaces/employee/employee';

const handleSetUserResponse: (res: ApiResponse<User>) => User = (res) => ({
  email: res.data.email,
  name: res.data.name,
  username: res.data.username,
  givenName: res.data.givenName,
  surname: res.data.surname,
  permissions: res.data.permissions,
  ADgroups: res.data.ADgroups,
  systemRole: res.data.systemRole,
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

export const UserInfoByUsername = async (username: string): Promise<PortalPersonData> => {
  const url = `/getEmployeeByLoginName/${username}`;
  return await apiService
    .get<ApiResponse<PortalPersonData>>(url)
    .then((res) => {
      return res.data.data;
    })
    .catch((e) => {
      return e;
    });
};

export const UserEmployments: (personId: string) => Promise<Employee[]> = async (personId: string) => {
  return await apiService
    .get<ApiResponse<Employee[]>>(`getemployments/${personId}/employeeEmployments`)
    .then((res) => {
      return res.data.data;
    })
    .catch((e) => {
      console.error('Something went wrong when fetching user employments');
      throw e;
    });
};

export const getAvatarResponse = async (): Promise<Base64URLString> => {
  const url = `/user/avatar?width=44`;
  return await apiService.get<Base64URLString>(url).then((res) => {
    return res.data;
  });
};

interface State {
  user: User;
  userFetched: boolean;
  userId: string;
  workTitle: string | null | undefined;
  myEmployments: Employee[];
  avatarResponse: string;
  userEmpIsLoading: boolean;
}
interface Actions {
  setUser: (user: User) => void;
  setAvatarResponse: (avatarResponse: string) => void;
  setUserEmpIsLoading: (userEmpIsLoading: boolean) => void;
  getMe: () => Promise<ServiceResponse<User>>;
  getMyEmployments: () => Promise<ServiceResponse<PortalPersonData>>;
  reset: () => void;
}

const initialState: State = {
  user: emptyUser,
  userFetched: false,
  userId: '',
  workTitle: 'Kommunanställd',
  myEmployments: [],
  avatarResponse: '',
  userEmpIsLoading: false,
};

export const useUserStore = createWithEqualityFn<State & Actions>()(
  devtools(
    (set, get) => ({
      ...initialState,
      setUserEmpIsLoading: (userEmpIsLoading) => set(() => ({ userEmpIsLoading })),
      setUser: (user) => set(() => ({ user })),
      setAvatarResponse: (avatarResponse) => set(() => ({ avatarResponse })),
      getMe: async () => {
        let user: User | undefined = get().user;
        const res = await getMe();
        if (!res.error) {
          user = res.data;
          set(() => ({ user: user }));
        }

        if (user?.username) {
          const info = await UserInfoByUsername(user.username);
          if (info?.personid) {
            set(() => ({ userId: info.personid }));
          }
        }

        set(() => ({ userFetched: true }));
        return { data: user };
      },
      getMyEmployments: async () => {
        set(() => ({ userEmpIsLoading: true }));
        const state = get();

        if (!state.user?.username) {
          return { data: state.workTitle, userEmpIsLoading: false };
        }

        try {

          // 1. Hämta persondata
          let id: string = get().userId;
          if(id === '') {
            const info = await UserInfoByUsername(get().user.username);
            id = info.personid || '';
          }
          
          const employments = await UserEmployments(id);

          if (employments) {
            set(() => ({ myEmployments: employments }));
          }

          let title: string | null | undefined = 'Kommunanställd';
          let company: number | undefined;

          // 3. Hitta rätt company via account
          employments.forEach((e) => {
            e.accounts?.forEach((a) => {
              if (a.loginname === state.user?.username) {
                company = a.companyId;
              }
            });
          });

          // 4. Hitta titel via company
          employments.forEach((e) => {
            e.employments?.forEach((em) => {
              if (em.companyId === company) {
                title = em.title;
              }
            });
          });

          // 5. Spara i store
          set(() => ({ workTitle: title, userEmpIsLoading: false }));

          return { data: title };
        } catch (e) {
          console.error('Failed to fetch work title', e);
          return { data: state.workTitle, userEmpIsLoading: false };
        }
      },
      reset: () => {
        set(initialState);
      },
    }),
    { enabled: __DEV__ }
  )
);
