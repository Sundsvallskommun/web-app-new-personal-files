import { Employee, Employment, PortalPersonData } from '@interfaces/employee/employee';
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
    .get<Employee[]>(`/portalpersondata/${personId}/employeeEmployments`)
    .then((res) => {
      return res.data;
    })
    .catch((e) => {
      console.error('Something went wrong when fetching AD user on id');
      throw e;
    });
};

export const searchADUserEmploymentsById: (personId: string) => Promise<Employee[]> = async (personId: string) => {
  return await apiService
    .get<Employee[]>(`/portalpersondata/${personId}/employeeEmployments`)
    .then((res) => {
      return res.data;
    })
    .catch((e) => {
      console.error('Something went wrong when fetching AD user on id');
      throw e;
    });
};

export const searchADUserByUsername = async (
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
  employeeEmployments: Employee[];
  employmentslist: Employment[];
  partyId: string
  empIsLoading: boolean;
}
interface Actions {
  setSelectedEmployment: (selectedEmployment: Employment) => void;
  setEmployee: (employee: Employee[]) => void;
  setPartyId: (partyId: string) => void;
  setEmployments: (employmentslist: Employment[]) => void;
  setEmployeeUserEmployments: (employeeEmployments: Employee[]) => void;
  getADUserEmployments: (personalNumber: string) => Promise<ServiceResponse<Employee[]>>;
  getEmploymentsById: (personId: string) => Promise<ServiceResponse<Employee[]>>;
  setEmpIsLoading: (empIsLoading: boolean) => void;
  reset: () => void;
}

const initialState: State = {
  selectedEmployment: {},
  employeeEmployments: [],
  employmentslist: [],
  partyId: '',
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
        employeeEmployments: Employee[];
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
        setPartyId: (partyId) => set(() => ({ partyId })),
        setEmployeeUserEmployments: (employeeEmployments) => set(() => ({ employeeEmployments })),
        setSelectedEmployment: (selectedEmployment) => set(() => ({ selectedEmployment })),
        setEmployee: (employeeEmployments) => set(() => ({ employeeEmployments })),
        setEmployments: (employmentslist) => set(() => ({ employmentslist })),
        getADUserEmployments: async (personalNumber: string) => {
          let employeeEmployments = get().employeeEmployments;
          set(() => ({ empIsLoading: true }));
          const id = await searchADGuidByPersonNumber(personalNumber);
          if(id) {
            set(() => ({ partyId: id }));
          }
          const res = await searchHitADUser(id);

          if (res) {
            employeeEmployments = res;
            set(() => ({ employeeEmployments: employeeEmployments, empIsLoading: false }));
          }
          return { data: employeeEmployments };
        },
        getEmploymentsById: async (personId: string) => {
          let employeeEmployments = get().employeeEmployments;
          const res = await searchHitADUser(personId);
          if (res) {
            employeeEmployments = res;

            set(() => ({ employeeEmployments: employeeEmployments }));
          }
          return { data: employeeEmployments };
        },
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'employee-storage',
        version: 1,
        partialize: ({ employeeEmployments, employmentslist, selectedEmployment }) => ({
          employeeEmployments,
          employmentslist,
          selectedEmployment,
        }),
      }
    ),
    { enabled: __DEV__ }
  )
);
