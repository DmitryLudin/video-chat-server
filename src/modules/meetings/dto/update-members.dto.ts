import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { User } from 'src/modules/users/user.entity';

export class UpdateMembersDto {
  @ValidateNested({ each: true })
  @Type(() => User)
  members: User[];
}
