import { Exclude } from 'class-transformer';
import { User } from 'src/modules/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity()
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, {
    eager: true,
    cascade: true,
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  @Exclude()
  ownerId: number;

  @ManyToMany(() => User, { eager: true })
  @JoinTable()
  members: User[];

  @CreateDateColumn()
  createdAt: Date;
}
