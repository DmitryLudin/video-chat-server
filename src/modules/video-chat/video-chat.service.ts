import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { parse } from 'cookie';
import { Socket } from 'socket.io';
import { AuthenticationService } from 'src/modules/authentication/authentication.service';
import {
  MeetingsService,
  MessagesService,
} from 'src/modules/meetings/services';
import { JoinMeetingDto } from 'src/modules/video-chat/dto';

@Injectable()
export class VideoChatService {
  private readonly joinedUsers: Map<
    string,
    { meetingId: string; userId: number }
  > = new Map();

  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly meetingsService: MeetingsService,
    private readonly messagesService: MessagesService,
  ) {}

  clearAllConnections() {
    this.joinedUsers.clear();
  }

  async joinMeeting(client: Socket, { meetingId, userId }: JoinMeetingDto) {
    try {
      const meeting = await this.meetingsService.getByUserId(meetingId, userId);
      const messages = await this.messagesService.getAllByMeetingId(meeting.id);
      this.joinedUsers.set(client.id, { meetingId, userId });

      return { meeting, messages };
    } catch (error) {
      throw new WsException(error as object);
    }
  }

  async leaveMeeting(client: Socket) {
    try {
      const joinedUser = this.joinedUsers.get(client.id);
      console.log(joinedUser);
      this.joinedUsers.delete(client.id);
      return await this.meetingsService.deleteMember(
        joinedUser.meetingId,
        joinedUser.userId,
      );
    } catch (error) {
      console.log(error);
      throw new WsException(error as object);
    }
  }

  async getUserFromSocket(socket: Socket) {
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
