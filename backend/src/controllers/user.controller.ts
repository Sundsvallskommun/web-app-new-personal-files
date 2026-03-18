import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { Permissions } from '@/interfaces/users.interface';
import { UserApiResponse } from '@/responses/user.response';
import authMiddleware from '@middlewares/auth.middleware';
import { Controller, Get, Header, QueryParam, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import ApiService from '@/services/api.service';
import { PortalPersonData } from '@/interfaces/employee.interface';
interface ClientUser {
  name: string;
  givenName: string;
  surname: string;
  username: string;
  permissions: Permissions;
  role: string;
}

@Controller()
export class UserController {
  private apiService = new ApiService();

  @Get('/me')
  @OpenAPI({
    summary: 'Return current user',
  })
  @ResponseSchema(UserApiResponse)
  @UseBefore(authMiddleware)
  async getUser(@Req() req: RequestWithUser, @Res() response: any): Promise<ClientUser> {
    const { name, username, givenName, surname, permissions, role } = req.user;

    if (!name) {
      throw new HttpException(400, 'Bad Request');
    }

    const userData: ClientUser = {
      name: name,
      username: username,
      givenName: givenName,
      surname: surname,
      permissions: permissions,
      role: role,
    };

    return response.send({ data: userData, message: 'success' });
  }

  @Get('/user/avatar')
  @OpenAPI({ summary: 'Return logged in person image' })
  @UseBefore(authMiddleware)
  @Header('Content-Type', 'image/jpeg')
  @Header('Cross-Origin-Embedder-Policy', 'require-corp')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  async getMyEmployeeImage(@Req() req: RequestWithUser, @QueryParam('width') width): Promise<any> {
    const { username } = req.user;

    const userURL = `employee/1.0/portalpersondata/PERSONAL/${username}`;
    const personId = await this.apiService.get<PortalPersonData>({ url: userURL }, req.user).then(res => {
      return res.data.personid;
    });

    if (!personId) {
      throw new HttpException(400, 'Bad Request');
    }

    const url = `employee/1.0/${personId}/personimage`;
    const res = await this.apiService.get<any>(
      {
        url,
        responseType: 'arraybuffer',
        params: {
          width: width,
        },
      },
      req.user,
    );
    return res.data;
  }
}
