import { Exclude } from 'class-transformer';
import { Channel } from 'src/modules/channels/entities';
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

  @OneToMany(() => Channel, (channel: Channel) => channel.owner)
  channels: Channel[];
}
