import { Exclude } from 'class-transformer';
import { User } from 'src/modules/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 250, default: '' })
  text: string;

  @Column()
  meetingId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ nullable: true })
  @Exclude()
  authorId: number;

  @OneToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'replyMessageId' })
  reply: Message;

  @Column({ nullable: true })
  @Exclude()
  replyMessageId: string;

  @CreateDateColumn()
  createdAt: Date;
}
