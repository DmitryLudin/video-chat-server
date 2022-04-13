import { Exclude } from 'class-transformer';
import { Meeting } from 'src/modules/meetings/entities';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Exclude()
  password: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ nullable: true })
  @Exclude()
  currentHashedRefreshToken?: string;

  @OneToMany(() => Meeting, (meeting: Meeting) => meeting.owner)
  meetings: Meeting[];
}
