import App from '@/app';
import { registeredControllers } from '@/registered-controllers';
import { initRedis } from '@utils/initRedis';
import validateEnv from '@utils/validateEnv';

validateEnv();

async function bootstrap() {
  await initRedis();

  const app = new App(registeredControllers);

  app.listen();
}

bootstrap().catch(err => {
  console.error('Failed to start app:', err);
  process.exit(1);
});
