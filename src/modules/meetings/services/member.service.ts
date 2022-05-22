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

  async create(memberData: CreateMemberDto) {
    const member = this.membersRepository.create(memberData);

    return await this.membersRepository.save(member);
  }

  async deleteByUserId(userId: number) {
    return await this.membersRepository.delete({ userId });
  }
}
