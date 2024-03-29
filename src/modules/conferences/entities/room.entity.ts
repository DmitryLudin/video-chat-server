import { Exclude } from 'class-transformer';
import { Member } from 'src/modules/conferences/entities/member.entity';
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
export class Room {
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

  @OneToMany(() => Member, (member) => member.room, {
    eager: true,
    cascade: true,
  })
  members: Member[];

  @CreateDateColumn()
  createdAt: Date;
}
