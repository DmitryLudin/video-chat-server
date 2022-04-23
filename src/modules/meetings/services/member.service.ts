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

  async getById(memberId: string) {
    return await this.membersRepository.findOne({ where: { id: memberId } });
  }

  async getByUserId(userId: number) {
    return await this.membersRepository.findOne({
      where: { userId },
      relations: ['meeting'],
    });
  }

  async create(memberData: CreateMemberDto) {
    const member = this.membersRepository.create(memberData);
    const savedMember = await this.membersRepository.save(member);
    return this.getById(savedMember.id);
  }

  async deleteByUserId(userId: number) {
    return await this.membersRepository.delete({ userId });
  }
}
