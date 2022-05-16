import { Exclude } from 'class-transformer';
import { Consumer } from 'mediasoup/node/lib/Consumer';
import { Producer } from 'mediasoup/node/lib/Producer';
import { Transport } from 'mediasoup/node/lib/Transport';
import { WebRtcTransport } from 'mediasoup/node/lib/WebRtcTransport';
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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Meeting, (meeting) => meeting.members, {
    orphanedRowAction: 'delete',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  meeting: Meeting;

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

  @Column(() => WebRtcTransport)
  @Exclude()
  webRtcProduceTransport?: WebRtcTransport;

  @Column(() => WebRtcTransport)
  @Exclude()
  webRtcConsumeTransport?: WebRtcTransport;

  @Column(() => Producer)
  @Exclude()
  producer?: Producer;

  @Column(() => Consumer)
  @Exclude()
  consumer?: Consumer;
}
