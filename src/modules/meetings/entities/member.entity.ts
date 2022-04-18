import { Exclude } from 'class-transformer';
import { Meeting } from 'src/modules/meetings/entities/meeting.entity';
import { User } from 'src/modules/users/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Member {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Meeting, (meeting) => meeting.members, {
    orphanedRowAction: 'delete',
  })
  meeting: Meeting;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  @Exclude()
  userId: number;

  @Column({ default: false })
  isAudioOn: boolean;

  @Column({ default: false })
  isVideoOn: boolean;

  @Column({ default: false })
  isSpeaking: boolean;
}
