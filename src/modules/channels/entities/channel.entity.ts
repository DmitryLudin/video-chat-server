import { User } from 'src/modules/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ length: 20 })
  name: string;

  @Column({ length: 60 })
  description: string;

  @Column()
  ownerId: string;

  @Column({ default: false })
  isMeetingStarted: boolean;

  @ManyToMany(() => User, { eager: true })
  @JoinTable()
  members: Array<User>;
}
