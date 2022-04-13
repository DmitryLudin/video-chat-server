import { User } from 'src/modules/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user: User) => user.meetings, {
    eager: true,
  })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToMany(() => User, { eager: true })
  @JoinTable()
  members: Array<User>;

  @CreateDateColumn()
  createdAt: Date;
}
