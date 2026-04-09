import { Employee } from '@interfaces/employee/employee';
import { ApiResponse } from '@services/api-service';

export const emptyEmployee: Employee = {
  personId: '',
  personNumber: '',
  isClassified: false,
  givenname: '',
  middlename: '',
  lastname: '',
  accounts: [],
  referenceNumbers: [],
  employments: [],
};

export const emptyEmployeeResponse: ApiResponse<Employee> = {
  data: emptyEmployee,
  message: 'none',
};
