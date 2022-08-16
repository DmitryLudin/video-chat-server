import { Exclude } from 'class-transformer';
import { Member } from 'src/modules/conferences/entities/member.entity';
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
  roomId: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'authorId' })
  author: Member;

  @Column({ nullable: true })
  @Exclude()
  authorId: string;

  @OneToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'replyMessageId' })
  reply: Message;

  @Column({ nullable: true })
  @Exclude()
  replyMessageId: string;

  @CreateDateColumn()
  createdAt: Date;
}
