import { clearPersonDataStorage } from '@utils/clear-person-data-storage';
import { ApiResponse, apiService } from '../api-service';
import { createWithEqualityFn } from 'zustand/traditional';
import { devtools } from 'zustand/middleware';
import { __DEV__ } from '@sk-web-gui/react';
import { emptyUser } from './defaults';
import { ServiceResponse } from '@interfaces/services';
import { EndedEmploymentEvent, User } from '@data-contracts/backend/data-contracts';
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

export const getEndedEmployments: (personId: string) => Promise<EndedEmploymentEvent[]> = async (personId: string) => {
  return await apiService
    .get<ApiResponse<EndedEmploymentEvent[]>>(`endedEmployments/${personId}`)
    .then((res) => {
      return res.data.data;
    })
    .catch((e) => {
      console.error('Something went wrong when fetching ended employments');
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

export const getAvatarResponse = async (): Promise<string> => {
  const url = `/user/avatar?width=44`;
  const res = await apiService.get<Blob>(url, { responseType: 'blob' });
  return res.data.size > 0 ? URL.createObjectURL(res.data) : '';
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
  myEndedEmployments: EndedEmploymentEvent[];
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
  getMyEndedEmployments: () => Promise<ServiceResponse<EndedEmploymentEvent[]>>;
  reset: () => void;
}

const initialState: State = {
  user: emptyUser,
  userFetched: false,
  userId: '',
  workTitle: 'Kommunanställd',
  myEmployments: [],
  myEndedEmployments: [],
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

        const sessionIsGone = res.error === 401;
        if (sessionIsGone) {
          clearPersonDataStorage();
        }

        if (!res.error) {
          user = res.data;
          set(() => ({ user: user }));
        }

        if (user?.personId) {
          set(() => ({ userId: user.personId }));
        } else if (user?.username) {
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
          set(() => ({ userEmpIsLoading: false }));
          return { data: state.workTitle };
        }

        try {
          const id: string = get().userId;

          if (!id) {
            set(() => ({ userEmpIsLoading: false }));
            return { data: state.workTitle, userEmpIsLoading: false };
          }

          const employments = await UserEmployments(id);

          if (employments) {
            set(() => ({ myEmployments: employments }));
          }

          let title: string | null | undefined = 'Kommunanställd';
          let company: number | undefined;

          employments.forEach((e) => {
            e.accounts?.forEach((a) => {
              if (a.loginname === state.user?.username) {
                company = a.companyId;
              }
            });
          });

          employments.forEach((e) => {
            e.employments?.forEach((em) => {
              if (em.companyId === company) {
                title = em.title;
              }
            });
          });

          set(() => ({ workTitle: title, userEmpIsLoading: false }));

          return { data: title };
        } catch (e) {
          console.error('Failed to fetch work title', e);
          set(() => ({ userEmpIsLoading: false }));
          return { data: state.workTitle };
        }
      },
      getMyEndedEmployments: async () => {
        set(() => ({ userEmpIsLoading: true }));
        const state = get();

        if (!state.user?.username) {
          set(() => ({ userEmpIsLoading: false }));
          return { data: [] };
        }

        try {
          let id: string = get().userId;
          if (id === '') {
            const info = await UserInfoByUsername(get().user.username, get().user.personId);
            id = resolvePersonId(info);
          }

          if (!id) {
            set(() => ({ userEmpIsLoading: false }));
            return { data: [] };
          }

          const endedEmployments = await getEndedEmployments(id);
          set(() => ({ myEndedEmployments: endedEmployments, userEmpIsLoading: false }));
          return { data: endedEmployments };
        } catch (e) {
          console.error('Failed to fetch ended employments', e);
          set(() => ({ userEmpIsLoading: false }));
          return { data: [] };
        }
      },
      getManagerEmployees: async (query?: ManagerEmployeesQuery) => {
        set(() => ({ managerEmpIsLoading: true }));
        const state = get();

        try {
          const id: string = get().userId;

          if (!id) {
            set(() => ({ managerEmpIsLoading: false }));
            return { data: state.managerEmployees, managerEmpIsLoading: false };
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
