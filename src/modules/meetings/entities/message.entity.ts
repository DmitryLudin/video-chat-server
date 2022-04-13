import { User } from 'src/modules/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 250, default: '' })
  text: string;

  @Column()
  meetingId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'reply_message_id' })
  reply: Message;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
