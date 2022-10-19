import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { instanceToPlain } from 'class-transformer';
import { Socket } from 'socket.io';
import { AuthenticationService } from 'src/modules/authentication/authentication.service';
import { RoomsService } from 'src/modules/conferences/modules/rooms/rooms.service';

@Injectable()
export class ConferenceGatewayHelperService {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly roomsService: RoomsService,
  ) {}

  async getUserAndRoomFromSocket(client: Socket) {
    try {
      const user = await this.authenticationService.getUserFromSocket(client);
      const room = await this.roomsService.getByUserId(user.id);

      return { user, room };
    } catch (error) {
      throw new WsException(error as object);
    }
  }

  deserializeData<T extends object>(data: T): T {
    return instanceToPlain(data) as T;
  }
}
