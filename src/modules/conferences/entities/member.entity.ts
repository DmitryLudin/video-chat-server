import { Exclude } from 'class-transformer';
import { Room } from 'src/modules/conferences/entities/room.entity';
import { User } from 'src/modules/users/user.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Room, (room) => room.members, {
    orphanedRowAction: 'delete',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  room: Room;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  @Exclude()
  userId: number;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ default: false })
  isAudioOn: boolean;

  @Column({ default: false })
  isVideoOn: boolean;

  @Column({ default: false })
  isSpeaking: boolean;

  @DeleteDateColumn()
  deletedAt?: Date;
}
