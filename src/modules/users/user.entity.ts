import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @Exclude()
  public password: string;

  @Column({ unique: true })
  public username: string;

  @Column({ default: false })
  public isOnline?: boolean;

  @Column({ nullable: true })
  public displayName?: string;

  @Column({ nullable: true })
  public avatar?: string;
}
