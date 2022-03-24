import { User } from 'src/modules/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ length: 250, default: '' })
  text: string;

  @Column()
  channelId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  author: User;

  @ManyToOne(() => Message, { nullable: true, eager: true, cascade: true })
  @JoinColumn()
  reply: Message;

  @CreateDateColumn()
  created_at: Date;
}
