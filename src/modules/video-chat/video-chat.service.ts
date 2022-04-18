import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { parse } from 'cookie';
import { Socket } from 'socket.io';
import { AuthenticationService } from 'src/modules/authentication/authentication.service';
import {
  MeetingsService,
  MemberService,
  MessagesService,
} from 'src/modules/meetings/services';
import { JoinMeetingDto, LeaveMeetingDto } from 'src/modules/video-chat/dto';

@Injectable()
export class VideoChatService {
  private readonly connectedUsers: Map<string, number> = new Map();

  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly meetingsService: MeetingsService,
    private readonly messagesService: MessagesService,
    private readonly membersService: MemberService,
  ) {}

  async connectUser(client: Socket) {
    try {
      const user = await this.getUserFromSocket(client);
      this.connectedUsers.set(client.id, user.id);
      console.log('connected', user.id);
    } catch {
      client.disconnect();
    }
  }

  async disconnectUser(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    const member = await this.membersService.getByUserId(userId);

    if (member) {
      await this.membersService.delete(member.id);
    }

    this.connectedUsers.delete(client.id);
    client.disconnect();
    console.log('disconnect', userId);
  }

  clearConnectedUsers() {
    this.connectedUsers.clear();
  }

  async joinMeeting(client: Socket, meetingData: JoinMeetingDto) {
    await this.connectUser(client);

    const userId = this.connectedUsers.get(client.id);
    const meeting = await this.meetingsService.addMember(
      meetingData.meetingId,
      userId,
    );
    const messages = await this.messagesService.getAllByMeetingId(meeting.id);

    return { meeting, messages };
  }

  async leaveMeeting({ meetingId, memberId }: LeaveMeetingDto) {
    return await this.meetingsService.deleteMember(meetingId, memberId);
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
