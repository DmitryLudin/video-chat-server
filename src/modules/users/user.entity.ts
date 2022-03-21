import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  public email: string;

  @Column()
  @Exclude()
  public password: string;

  @Column()
  public username: string;

  @Column()
  public isOnline: boolean;

  @Column()
  public displayName?: string;

  @Column()
  public avatar?: string;
}
