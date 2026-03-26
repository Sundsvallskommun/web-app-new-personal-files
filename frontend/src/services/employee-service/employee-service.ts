import { Employee, Employment, LoginName, PortalPersonData } from '@interfaces/employee/employee';
import { ApiResponse, apiService } from '@services/api-service';
import { createWithEqualityFn } from 'zustand/traditional';
import { devtools, persist } from 'zustand/middleware';
import { ServiceResponse } from '@interfaces/services';
import { __DEV__ } from '@sk-web-gui/react';

const luhnCheck = (str = ''): boolean => {
  str = str?.replace('-', '');
  if (!str) {
    return false;
  }
  str = str.length === 12 ? str.slice(2) : str;
  let sum = 0;
  for (let i = 0, l = str.length; i < l; i++) {
    let v = parseInt(str[i]);
    v *= 2 - (i % 2);
    if (v > 9) {
      v -= 9;
    }
    sum += v;
  }
  return sum % 10 === 0;
};

export const isValidPersonalNumber: (ssn: string) => boolean = (ssn) =>
  luhnCheck(ssn) && ((ssn.length === 12 && parseInt(ssn[4]) < 2) || (ssn.length === 10 && parseInt(ssn[2]) < 2));

export const setAdministrationCode: (orgTree: string) => string | {} = (orgTree) => {
  return {
    administrationCodes: orgTree.split('¤')[0].split('|')[1].toString(),
  };
};

export const searchHitADUser: (personId: string) => Promise<Employee[]> = async (personId: string) => {
  return await apiService
    .get<Employee[]>(`/portalpersondata/${personId}/employeeUsersEmployments`)
    .then((res) => {
      return res.data;
    })
    .catch((e) => {
      console.error('Something went wrong when fetching AD user på id');
      throw e;
    });
};

export const searchADUserById: (personId: string) => Promise<Employee[]> = async (personId: string) => {
  return await apiService
    .get<Employee[]>(`/portalpersondata/${personId}/employeeUsersEmployments`)
    .then((res) => {
      return res.data;
    })
    .catch((e) => {
      console.error('Something went wrong when fetching AD user på id');
      throw e;
    });
};

export const searchADUserByUsername: (username: string) => Promise<PortalPersonData> = async (username: string) => {
  return await apiService
    .get<PortalPersonData>(`/portalpersondata/personal/${username}`)
    .then((res) => {
      return res.data;
    })
    .catch((e) => {
      console.error('Something went wrong when fetching AD user på username');
      throw e;
    });
};
export async function searchADGuidByPersonNumber(personalNumber: string) {
  personalNumber = personalNumber.replace(/\D/g, '');
  return !isValidPersonalNumber(personalNumber) ?
      Promise.resolve('')
    : await apiService
        .get<ApiResponse<string>>(`/portalpersondata/${personalNumber}/guid`)
        .then((res) => {
          return res.data.data;
        })

}

interface State {
  selectedEmployment: Employment;
  employeeUsersEmployments: Employee[];
  employmentslist: Employment[];
  empIsLoading: boolean;
}
interface Actions {
  setSelectedEmployment: (selectedEmployment: Employment) => void;
  setEmployee: (employee: Employee[]) => void;
  setEmployments: (employmentslist: Employment[]) => void;
  setEmployeeUserEmployments: (employeeUsersEmployments: Employee[]) => void;
  getADUserEmployments: (personalNumber: string) => Promise<ServiceResponse<Employee[]>>;
  getEmploymentsById: (personId: string) => Promise<ServiceResponse<Employee[]>>;
  setEmpIsLoading: (empIsLoading: boolean) => void;
  reset: () => void;
}

const initialState: State = {
  selectedEmployment: {},
  employeeUsersEmployments: [],
  employmentslist: [],
  empIsLoading: false,
};

export const useEmployeeStore = createWithEqualityFn<
  State & Actions,
  [
    ['zustand/devtools', never],
    [
      'zustand/persist',
      {
        selectedEmployment: Employment;
        employeeUsersEmployments: Employee[];
        employmentslist: Employment[];
      },
    ],
  ]
>(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        setEmpIsLoading: (empIsLoading) => set(() => ({ empIsLoading })),
        setEmployeeUserEmployments: (employeeUsersEmployments) => set(() => ({ employeeUsersEmployments })),
        setSelectedEmployment: (selectedEmployment) => set(() => ({ selectedEmployment })),
        setEmployee: (employeeUsersEmployments) => set(() => ({ employeeUsersEmployments })),
        setEmployments: (employmentslist) => set(() => ({ employmentslist })),
        getADUserEmployments: async (personalNumber: string) => {
          let employeeUsersEmployments = get().employeeUsersEmployments;
          set(() => ({ empIsLoading: true }));
          const userId = await searchADGuidByPersonNumber(personalNumber);
          const res = await searchHitADUser(userId);

          if (res) {
            employeeUsersEmployments = res;
            set(() => ({ employeeUsersEmployments: employeeUsersEmployments, empIsLoading: false }));
          }
          return { data: employeeUsersEmployments };
        },
        getEmploymentsById: async (personId: string) => {
          let employeeUsersEmployments = get().employeeUsersEmployments;
          const res = await searchHitADUser(personId);
          if (res) {
            employeeUsersEmployments = res;

            set(() => ({ employeeUsersEmployments: employeeUsersEmployments }));
          }
          return { data: employeeUsersEmployments };
        },
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'employee-storage',
        version: 1,
        partialize: ({ employeeUsersEmployments, employmentslist, selectedEmployment }) => ({
          employeeUsersEmployments,
          employmentslist,
          selectedEmployment,
        }),
      }
    ),
    { enabled: __DEV__ }
  )
);
