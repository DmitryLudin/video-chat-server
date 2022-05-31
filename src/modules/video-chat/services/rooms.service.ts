import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostgresErrorCode } from 'src/modules/database/constants';
import { CreateMemberDto, CreateRoomDto } from 'src/modules/video-chat/dto';
import { Room } from 'src/modules/video-chat/entities';
import { MembersService } from 'src/modules/video-chat/services/members.service';
import { MessagesService } from 'src/modules/video-chat/services/messages.service';
import { Repository } from 'typeorm';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepository: Repository<Room>,
    private readonly membersService: MembersService,
    private readonly messagesService: MessagesService,
  ) {}

  async getById(id: string) {
    const room = await this.roomsRepository.findOne({
      where: { id },
    });

    if (!room) {
      throw new NotFoundException({
        message: `Встреча с таким id ${id} не найдена`,
        code: 'room_not_found',
      });
    }

    return room;
  }

  async getByIdAndUserId(roomId: string, userId: number) {
    const room = await this.getById(roomId);
    const member = room.members.find((member) => member.userId === userId);

    if (!member) {
      throw new NotFoundException({
        message: `Пользователь не является участником встречи`,
        code: 'user_not_member',
      });
    }

    return room;
  }

  async getByUserId(userId: number) {
    const room = await this.roomsRepository.findOne({
      where: {
        members: { userId },
      },
    });

    if (!room) {
      throw new NotFoundException({
        message: `Пользователь не является участником встречи`,
        code: 'user_not_member',
      });
    }

    return room;
  }

  async create(data: CreateRoomDto) {
    const { ownerId } = data;

    const room = this.roomsRepository.create({
      ownerId,
      members: [{ userId: ownerId }],
    });
    await this.roomsRepository.save(room);

    return this.getById(room.id);
  }

  async delete(id: string) {
    await this.messagesService.deleteAllByRoomId(id);

    return await this.roomsRepository.delete({ id });
  }

  // Member methods
  async addMember(roomId: string, data: CreateMemberDto) {
    try {
      const room = await this.getById(roomId);

      await this.roomsRepository.save({
        ...room,
        members: [...room.members, data],
      });

      return this.getById(room.id);
    } catch (error: unknown) {
      const postgresError = error as { code?: string };

      if (postgresError?.code === PostgresErrorCode.UniqueViolation) {
        throw new HttpException(
          'Пользователь уже является участником встречи',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Что-то пошло не так',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteMember(roomId: string, userId: number) {
    try {
      await this.membersService.deleteByUserId(userId);

      return await this.getById(roomId);
    } catch {
      throw new HttpException(
        'Что-то пошло не так',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
