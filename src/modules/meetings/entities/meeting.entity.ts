import { Exclude } from 'class-transformer';
import { Member } from 'src/modules/meetings/entities/member.entity';
import { User } from 'src/modules/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Column,
  OneToMany,
} from 'typeorm';

@Entity()
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, {
    eager: true,
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  @Exclude()
  ownerId: number;

  @OneToMany(() => Member, (member) => member.meeting, {
    eager: true,
    cascade: true,
  })
  members: Member[];

  @CreateDateColumn()
  createdAt: Date;
}
