import { IndexController } from '@controllers/index.controller';
import { UserController } from '@controllers/user.controller';
import { HealthController } from '@controllers/health.controller';
import { EmployeeController } from '@controllers/employee.controller';
import { DocumentController } from '@controllers/document.controller';
import { FoundationObjectController } from '@controllers/foundation-object.controller';

export const registeredControllers: Function[] = [
  IndexController,
  UserController,
  HealthController,
  EmployeeController,
  DocumentController,
  FoundationObjectController,
];
