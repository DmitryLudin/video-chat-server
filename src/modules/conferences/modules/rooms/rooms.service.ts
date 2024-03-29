import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from 'src/modules/conferences/entities';
import { MembersService } from 'src/modules/conferences/modules/members/members.service';
import { MessagesService } from 'src/modules/conferences/modules/messages/messages.service';
import { CreateRoomDto } from 'src/modules/conferences/modules/rooms/dto';
import { ICreateMemberDto } from 'src/modules/conferences/types/room.types';
import { PostgresErrorCode } from 'src/modules/database/constants';
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
        message: `Комната с таким id ${id} не найдена`,
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

  async create({ ownerId }: CreateRoomDto) {
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

  // Members
  async addMember(roomId: string, data: ICreateMemberDto) {
    try {
      const room = await this.getById(roomId);
      const member = await this.membersService.create(data);

      await this.roomsRepository.save({
        ...room,
        members: [...room.members, member],
      });

      return this.getById(roomId);
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
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Что-то пошло не так',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
