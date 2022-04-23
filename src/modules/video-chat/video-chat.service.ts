import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { instanceToPlain } from 'class-transformer';
import { parse } from 'cookie';
import { Socket } from 'socket.io';
import { AuthenticationService } from 'src/modules/authentication/authentication.service';
import { Meeting } from 'src/modules/meetings/entities';
import {
  MeetingsService,
  MessagesService,
} from 'src/modules/meetings/services';
import { User } from 'src/modules/users/user.entity';
import { VideoChatAction } from 'src/modules/video-chat/constants/actions.enum';

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
      client.join(meeting.id);
      client.to(meeting.id).emit(VideoChatAction.JOIN_MEETING, {
        meeting: this.deserializeData(meeting),
      });
      client.emit(VideoChatAction.JOIN_MEETING, {
        meeting: this.deserializeData(meeting),
        messages: this.deserializeData(messages),
      });
    } catch (error) {
      console.log('join', error);
      client.emit(VideoChatAction.ERROR, {
        error,
      });
      client.disconnect();
    }
  }

  async disconnect(client: Socket) {
    try {
      const user = await this.getUserFromSocket(client);
      const meeting = await this.meetingsService.getByUserId(user.id);
      console.log('disconnect', client.id);

      if (meeting.ownerId === user.id) {
        return await this.endMeeting(client, meeting);
      }

      return await this.leaveMeeting(client, { meeting, user });
    } catch (error) {
      console.log('disconnect', error);
      client.emit(VideoChatAction.ERROR, {
        error,
      });
      client.disconnect();
    }
  }

  private async leaveMeeting(
    client: Socket,
    { meeting, user }: { meeting: Meeting; user: User },
  ) {
    try {
      const updatedMeeting = await this.meetingsService.deleteMember(
        meeting.id,
        user.id,
      );

      client.to(meeting.id).emit(VideoChatAction.LEAVE_MEETING, {
        meeting: this.deserializeData(updatedMeeting),
      });
      client.emit(VideoChatAction.LEAVE_MEETING, {
        meeting: this.deserializeData(updatedMeeting),
      });
      client.leave(meeting.id);
      client.disconnect();
    } catch (error) {
      console.log('leave', error);
      client.emit(VideoChatAction.ERROR, {
        error,
      });
    }
  }

  private async endMeeting(client: Socket, meeting: Meeting) {
    try {
      await this.meetingsService.endMeeting(meeting.id);
      client.to(meeting.id).emit(VideoChatAction.END_MEETING, {
        isMeetingOver: true,
      });
      client.leave(meeting.id);
      client.disconnect();
    } catch (error) {
      console.log('end', error);
      client.emit(VideoChatAction.ERROR, {
        error,
      });
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

  private deserializeData<T extends object>(data: T): T {
    return instanceToPlain(data) as T;
  }
}
