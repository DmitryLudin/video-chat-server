import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { parse } from 'cookie';
import { Socket } from 'socket.io';
import { AuthenticationService } from 'src/modules/authentication/authentication.service';
import { AddMessageDto } from 'src/modules/meetings/dto';
import {
  MeetingsService,
  MessagesService,
} from 'src/modules/meetings/services';

@Injectable()
export class VideoChatService {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly meetingsService: MeetingsService,
    private readonly messagesService: MessagesService,
  ) {}

  async connect(client: Socket) {
    try {
      const user = await this.getUserFromSocket(client);
      const meeting = await this.meetingsService.getByUserId(user.id);
      const messages = await this.messagesService.getAllByMeetingId(meeting.id);

      console.log('connect', client.id);
      return { meeting, messages };
    } catch (error) {
      console.log('join', error);
      throw new WsException(error as object);
    }
  }

  async disconnect(client: Socket) {
    try {
      const user = await this.getUserFromSocket(client);
      const meeting = await this.meetingsService.getByUserId(user.id);
      console.log('disconnect', client.id);

      if (meeting.ownerId === user.id) {
        await this.meetingsService.endMeeting(meeting.id);
        return { isMeetingOver: true, meeting };
      }

      const updatedMeeting = await this.meetingsService.deleteMember(
        meeting.id,
        user.id,
      );
      return { meeting: updatedMeeting };
    } catch (error) {
      console.log('disconnect', error);
      throw new WsException(error as object);
    }
  }

  async addMessage(client: Socket, addMessageData: AddMessageDto) {
    try {
      await this.messagesService.addMessage(addMessageData);
      return await this.messagesService.getAllByMeetingId(
        addMessageData.meetingId,
      );
    } catch (error) {
      console.log('add message', error);
      throw new WsException(error as object);
    }
  }

  private async getUserFromSocket(socket: Socket) {
    const cookie = socket.handshake.headers.cookie;
    const { Authentication: authenticationToken } = parse(cookie);
    const user =
      await this.authenticationService.getUserFromAuthenticationToken(
        authenticationToken,
      );

    if (!user) {
      throw new WsException('Неверные учетные данные.');
    }

    return user;
  }
}
