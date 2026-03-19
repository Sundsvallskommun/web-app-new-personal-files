import { createWithEqualityFn } from 'zustand/traditional';
import { devtools, persist } from 'zustand/middleware';
import { ServiceResponse } from '@interfaces/services';
import { __DEV__ } from '@sk-web-gui/react';
import { apiService } from '@services/api-service';
import { Company, FormOfEmployment } from '@data-contracts/backend/data-contracts';

export const getCompanies: () => Promise<Company[]> = async () => {
  return await apiService
    .get<{ data: Company[]; message: string }>(`/companies`)
    .then((res) => {
      return res.data.data;
    })
    .catch((e) => {
      console.error('Something went wrong when fetching companies');
      throw e;
    });
};

export const getFormOfEmployments: () => Promise<FormOfEmployment[]> = async () => {
  return await apiService
    .get<{ data: FormOfEmployment[]; message: string }>(`/formofemployments`)
    .then((res) => {
      return res.data.data;
    })
    .catch((e) => {
      console.error('Something went wrong when fetching form of employments');
      throw e;
    });
};

interface State {
  companies: Company[];
  formOfEmployments: FormOfEmployment[];
}

interface Actions {
  setCompanies: (companies: Company[]) => void;
  setFormOfEmployments: (employmentslist: FormOfEmployment[]) => void;
  getCompanies: () => Promise<ServiceResponse<Company[]>>;
  getFormOfEmployments: () => Promise<ServiceResponse<FormOfEmployment[]>>;
  reset: () => void;
}

const initialState: State = {
  companies: [],
  formOfEmployments: [],
};

export const useFoundationObjectStore = createWithEqualityFn<
  State & Actions,
  [
    ['zustand/devtools', never],
    [
      'zustand/persist',
      {
        companies: Company[];
        formOfEmployments: FormOfEmployment[];
      },
    ],
  ]
>(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        setCompanies: (companies) => set(() => ({ companies })),
        setFormOfEmployments: (formOfEmployments) => set(() => ({ formOfEmployments })),
        getCompanies: async () => {
          const res = await getCompanies();
          if (res) {
            set(() => ({ companies: res }));
          }
          return { data: res };
        },
        getFormOfEmployments: async () => {
          const res = await getFormOfEmployments();
          if (res) {
            set(() => ({ formOfEmployments: res }));
          }
          return { data: res };
        },
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'foundationObject-storage',
        version: 1,
        partialize: ({ companies, formOfEmployments }) => ({
          companies,
          formOfEmployments,
        }),
      }
    ),
    { enabled: __DEV__ }
  )
);
