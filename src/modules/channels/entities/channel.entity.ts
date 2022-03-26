import { User } from 'src/modules/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  name: string;

  @Column({ length: 60 })
  description: string;

  @ManyToOne(() => User, (user: User) => user.channels, {
    eager: true,
  })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ default: false })
  isMeetingStarted: boolean;

  @ManyToMany(() => User, { eager: true })
  @JoinTable()
  members: Array<User>;
}
