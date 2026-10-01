import App from '@/app';
import { IndexController } from '@controllers/index.controller';
import { initRedis } from '@utils/initRedis';
import validateEnv from '@utils/validateEnv';
import { UserController } from './controllers/user.controller';
import { HealthController } from './controllers/health.controller';
import { EmployeeController } from './controllers/employee.controller';
import { DocumentController } from './controllers/document.controller';
import { FoundationObjectController } from './controllers/foundation-object.controller';

validateEnv();

async function bootstrap() {
  await initRedis();

  const app = new App([IndexController, UserController, HealthController, EmployeeController, DocumentController, FoundationObjectController]);

  app.listen();
}

bootstrap().catch(err => {
  console.error('Failed to start app:', err);
  process.exit(1);
});
