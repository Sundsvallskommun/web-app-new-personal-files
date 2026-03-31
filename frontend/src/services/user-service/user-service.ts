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
interface WorkTitle {
  title: string;
}



const getMe: () => Promise<ServiceResponse<User>> = () => {
  return apiService
    .get<ApiResponse<User>>('me')
    .then((res) => ({ data: handleSetUserResponse(res.data) }))
    .catch((e) => ({
      message: e.response?.data.message,
      error: e.response?.status ?? 'UNKNOWN ERROR',
    }));
};
export const UserInfoByUsername: (username: string) => Promise<PortalPersonData> = async (username: string) => {
  console.log("username", username);
  return await apiService
    .get<PortalPersonData>(`portalpersondata/personal/${username}`)
    .then((res) => {
      console.log("data", res.data);
      return res.data;
    })
    .catch((e) => {
      console.error('Something went wrong when fetching AD user på username');
      throw e;
    });
};

export const UserEmployments: (personId: string) => Promise<Employee[]> = async (personId: string) => {
  return await apiService
    .get<Employee[]>(`portalpersondata/${personId}/employeeUsersEmployments`)
    .then((res) => {
      return res.data;
    })
    .catch((e) => {
      console.error('Something went wrong when fetching AD user on id');
      throw e;
    });
};

interface State {
  user: User;
  workTitle: string;
}
interface Actions {
  setUser: (user: User) => void;
  getMe: () => Promise<ServiceResponse<User>>;
  getWorkTitle:() => Promise<ServiceResponse<string>>;
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
        let workTitle: string | undefined = get().workTitle;
        const infoRes = await UserInfoByUsername(get().user.username).catch((e) => {
          return e;
        });
        const personId = infoRes.personid;
        const empRes = await UserEmployments(personId).then((eRes) => {
          let title: string | undefined | null = "Kommunanställd";
          let company: number | undefined;
          eRes.forEach(e => {
            e.accounts?.forEach(a => {
              if(a.loginname === get().user.username) {
                return company = a.companyId;
              }
            })
            e.employments?.forEach(em => {
              if(em.companyId === company) {
                return title = em.title;
              }
            })
          });

          return title;
          
        }).catch((e) => {
          return e;
        });
        if (!infoRes.error || !empRes.error){
          workTitle = empRes;
          set(() => ({ workTitle: workTitle }));
          return {data: workTitle}
        } else {
          set(() => ({ workTitle: get().workTitle }));
          return {data: get().workTitle}
        }

      },
      reset: () => {
        set(initialState);
      },
    }),
    { enabled: __DEV__ }
  )
);
