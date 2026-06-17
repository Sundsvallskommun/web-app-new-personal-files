import { ApiResponse, apiService } from '../api-service';
import { createWithEqualityFn } from 'zustand/traditional';
import { devtools } from 'zustand/middleware';
import { __DEV__ } from '@sk-web-gui/react';
import { emptyUser } from './defaults';
import { ServiceResponse } from '@interfaces/services';
import { User } from '@data-contracts/backend/data-contracts';
import {
  Employee,
  ManagerEmployeeDetailMeta,
  ManagerEmployeesQuery,
  PortalPersonData,
} from '@interfaces/employee/employee';

const handleSetUserResponse: (res: ApiResponse<User>) => User = (res) => ({
  email: res.data.email,
  name: res.data.name,
  username: res.data.username,
  givenName: res.data.givenName,
  surname: res.data.surname,
  permissions: res.data.permissions,
  ADgroups: res.data.ADgroups,
  systemRole: res.data.systemRole,
  workTitle: res.data.workTitle,
  personId: res.data.personId,
});

export const managerQueries: ManagerEmployeesQuery = {
  PageNumber: 1,
  PageSize: 12,
  OrderDirection: 'ASC',
  OrderBy: 'FullName',
};

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
  username: string,
  personId: string = ''
): Promise<PortalPersonData | Employee[]> => {
  const url = `/getEmployeeByLoginName/${username}${personId ? `?personId=${personId}` : ''}`;
  return await apiService
    .get<ApiResponse<PortalPersonData | Employee[]>>(url)
    .then((res) => {
      return res.data.data;
    })
    .catch((e) => {
      return e;
    });
};

const resolvePersonId = (info: PortalPersonData | Employee[] | undefined): string => {
  if (!info) return '';
  if ('length' in info) {
    return info[0]?.personId ?? '';
  }
  return info.personid ?? '';
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

export const searchManagerEmployeesByManagerId = async (
  managerId: string,
  query?: ManagerEmployeesQuery
): Promise<ManagerEmployeeDetailMeta> => {
  const params = new URLSearchParams();

  if (query?.PageNumber !== undefined) params.append('PageNumber', String(query.PageNumber));
  if (query?.PageSize !== undefined) params.append('PageSize', String(query.PageSize));
  if (query?.OrderBy) params.append('OrderBy', query.OrderBy);
  if (query?.OrderDirection) params.append('OrderDirection', query.OrderDirection);
  if (query?.search) params.append('search', query.search);

  const queryString = params.toString();

  const url = `/getmanageremployees/${managerId}/details`;
  const queryUrl = queryString ? `${url}?${queryString}` : url;

  return await apiService
    .get<ApiResponse<ManagerEmployeeDetailMeta>>(queryUrl)
    .then((res) => {
      return res.data.data;
    })
    .catch((e) => {
      if (e.response.status === 404) {
        return { pageNumber: 0, pageSize: 0, totalRecords: 0, totalPages: 0, data: [] };
      } else {
        throw e;
      }
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
  managerEmployees: ManagerEmployeeDetailMeta;
  managerEmpIsLoading: boolean;
  avatarResponse: string;
  userEmpIsLoading: boolean;
}
interface Actions {
  setUser: (user: User) => void;
  setAvatarResponse: (avatarResponse: string) => void;
  setUserEmpIsLoading: (userEmpIsLoading: boolean) => void;
  getMe: () => Promise<ServiceResponse<User>>;
  getMyEmployments: () => Promise<ServiceResponse<PortalPersonData>>;
  setManagerEmployees: (managerEmployees: ManagerEmployeeDetailMeta) => void;
  setManagerEmpIsLoading: (empIsLoading: boolean) => void;
  getManagerEmployees: (query?: ManagerEmployeesQuery) => Promise<ServiceResponse<ManagerEmployeeDetailMeta>>;
  reset: () => void;
}

const initialState: State = {
  user: emptyUser,
  userFetched: false,
  userId: '',
  workTitle: 'Kommunanställd',
  myEmployments: [],
  managerEmployees: {
    pageNumber: 0,
    pageSize: 0,
    totalRecords: 0,
    totalPages: 0,
    data: null,
  },
  managerEmpIsLoading: false,
  avatarResponse: '',
  userEmpIsLoading: false,
};

export const useUserStore = createWithEqualityFn<State & Actions>()(
  devtools(
    (set, get) => ({
      ...initialState,
      setUserEmpIsLoading: (userEmpIsLoading) => set(() => ({ userEmpIsLoading })),
      setManagerEmployees: (managerEmployees) => set(() => ({ managerEmployees })),
      setManagerEmpIsLoading: (managerEmpIsLoading) => set(() => ({ managerEmpIsLoading })),
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
          const info = await UserInfoByUsername(user.username, user.personId);
          const id = resolvePersonId(info);
          if (id) {
            set(() => ({ userId: id }));
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
          if (id === '') {
            const info = await UserInfoByUsername(get().user.username, get().user.personId);
            id = resolvePersonId(info);
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
      getManagerEmployees: async (query?: ManagerEmployeesQuery) => {
        set(() => ({ managerEmpIsLoading: true }));
        const state = get();

        try {
          // 1. Hämta persondata
          let id: string = get().userId;
          if (id === '') {
            const info = await UserInfoByUsername(get().user.username, get().user.personId);
            id = resolvePersonId(info);
          }

          const managerEmployees = await searchManagerEmployeesByManagerId(id, query);

          if (managerEmployees) {
            set(() => ({ managerEmployees: managerEmployees, managerEmpIsLoading: false }));
          }

          return { data: managerEmployees };
        } catch (e) {
          console.error('Failed to fetch manager employees', e);
          return { data: state.managerEmployees, managerEmpIsLoading: false };
        }
      },
      reset: () => {
        set(initialState);
      },
    }),
    { enabled: __DEV__ }
  )
);
