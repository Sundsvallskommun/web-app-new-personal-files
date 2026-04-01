import { ApiResponse, apiService } from '../api-service';
import { createWithEqualityFn } from 'zustand/traditional';
import { devtools } from 'zustand/middleware';
import { __DEV__ } from '@sk-web-gui/react';
import { emptyUser } from './defaults';
import { ServiceResponse } from '@interfaces/services';
import { User } from '@data-contracts/backend/data-contracts';
import { apiURL } from '@utils/api-url';
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

export const UserInfoByUsername = async (
  username: string
): Promise<PortalPersonData> => {
  const url = `/getEmployeeByLoginName/${username}`
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
    .get<ApiResponse<Employee[]>>(`getemployments/${personId}/employeeUsersEmployments`)
    .then((res) => {
      return res.data.data;
    })
    .catch((e) => {
      console.error('Something went wrong when fetching user employments');
      throw e;
    });
};

export const getAvatar = async (): Promise<string> => {
  const url = `/user/avatar?width=44`;
  return await apiService
    .get<ApiResponse<string>>(url)
    .then((res) => {
      return res.data.data;
    })
    .catch((e) => {
      return '';
    });
};

interface State {
  user: User;
  workTitle: string | null | undefined;
}
interface Actions {
  setUser: (user: User) => void;
  getMe: () => Promise<ServiceResponse<User>>;
  getWorkTitle: () => Promise<ServiceResponse<PortalPersonData>>;
  reset: () => void;
}

const initialState: State = {
  user: emptyUser,
  workTitle: 'Kommunanställd',
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
     getWorkTitle: async () => {
  const state = get();

  if (!state.user?.username) {
    console.error('No username available');
    return { data: state.workTitle };
  }

  try {
    // 1. Hämta persondata
    const info = await UserInfoByUsername(get().user.username);
    const personId = info.personid;

    if (!personId) {
      throw new Error('No personId found');
    }
    const employments = await UserEmployments(personId);

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
    set(() => ({ workTitle: title }));

    return { data: title };
  } catch (e) {
    console.error('Failed to fetch work title', e);
    return { data: state.workTitle };
  }
},
      reset: () => {
        set(initialState);
      },
    }),
    { enabled: __DEV__ }
  )
);
