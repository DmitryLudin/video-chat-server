import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMemberDto } from 'src/modules/meetings/dto';
import { Member } from 'src/modules/meetings/entities';
import { Repository } from 'typeorm';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
  ) {}

  async getAllByMeetingId(meetingId: string) {
    return await this.membersRepository.find({
      where: { meeting: { id: meetingId } },
    });
  }

  async getAllByUserId(userId: number) {
    return await this.membersRepository.find({
      where: { user: { id: userId } },
    });
  }

  async getById(memberId: number) {
    return await this.membersRepository.findOne({ where: { id: memberId } });
  }

  async getByMeetingId(meetingId: string) {
    return await this.membersRepository.findOne({
      where: { meeting: { id: meetingId } },
    });
  }

  async getByUserId(userId: number) {
    return await this.membersRepository.findOne({
      where: { user: { id: userId } },
    });
  }

  async create(memberData: CreateMemberDto) {
    const member = this.membersRepository.create(memberData);
    const savedMember = await this.membersRepository.save(member);
    return this.getById(savedMember.id);
  }

  async delete(memberId: number) {
    return await this.membersRepository.delete({ id: memberId });
  }
}
