import { Employee } from '@interfaces/employee/employee';
import { ApiResponse } from '@services/api-service';

export const emptyEmployee: Employee = {
  personId: '',
  personNumber: '',
  isClassified: undefined,
  givenname: '',
  middlename: '',
  lastname: '',
  loginname: '',
  emailAddress: '',
  referenceNumber: '',
  isManager: undefined,
  employments: [],
  employeeEvents: [],
};

export const emptyEmployeeResponse: ApiResponse<Employee> = {
  data: emptyEmployee,
  message: 'none',
};
