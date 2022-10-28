import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { cors } from 'src/constants/cors';
import { RoomEventEnum } from 'src/modules/conferences/constants/room-event.enum';
import { RoomsService } from 'src/modules/conferences/modules/rooms/rooms.service';
import { ConferenceGatewayHelperService } from 'src/modules/conferences/services';

@WebSocketGateway({ cors, namespace: 'conferences/rooms' })
export class RoomsGateway implements OnGatewayDisconnect, OnGatewayConnection {
  constructor(
    private readonly helperService: ConferenceGatewayHelperService,
    private readonly roomsService: RoomsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const { room } = await this.helperService.getUserAndRoomFromSocket(
        client,
      );

      client
        .to(room.id)
        .emit(
          RoomEventEnum.MEMBERS,
          this.helperService.deserializeData(room.members),
        );
      client.join(room.id);
    } catch (error) {
      console.log(error);
      client.emit(RoomEventEnum.ERROR, { error });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const { room, user } = await this.helperService.getUserAndRoomFromSocket(
        client,
      );
      const isRoomClosed = room.ownerId === user.id;

      if (isRoomClosed) {
        await this.roomsService.delete(room.id);
        client.to(room.id).emit(RoomEventEnum.CLOSE_ROOM, { isRoomClosed });
        return client.leave(room.id);
      }

      const updatedRoom = await this.roomsService.deleteMember(
        room.id,
        user.id,
      );

      client
        .to(room.id)
        .emit(
          RoomEventEnum.MEMBERS,
          this.helperService.deserializeData(updatedRoom.members),
        );
      client.leave(room.id);
    } catch (error) {
      client.emit(RoomEventEnum.ERROR, { error });
      client.disconnect();
    }
  }
}
