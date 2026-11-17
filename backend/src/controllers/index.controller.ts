import { Public } from '@middlewares/global-auth';
import { Controller, Get } from 'routing-controllers';

@Controller()
export class IndexController {
  @Public('Service root - static OK, reveals nothing and calls nothing downstream')
  @Get('/')
  index() {
    return 'OK';
  }
}
