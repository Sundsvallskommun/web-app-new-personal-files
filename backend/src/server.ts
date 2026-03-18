import App from '@/app';
import { IndexController } from '@controllers/index.controller';
import validateEnv from '@utils/validateEnv';
import { UserController } from './controllers/user.controller';
import { HealthController } from './controllers/health.controller';
import { EmployeeController } from './controllers/employee.controller';
import { DocumentController } from './controllers/document.controller';
import { FoundationObjectController } from './controllers/foundation-object.controller';

validateEnv();

const app = new App([IndexController, UserController, HealthController, EmployeeController, DocumentController, FoundationObjectController]);

app.listen();