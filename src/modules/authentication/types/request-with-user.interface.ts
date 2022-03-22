import { Request } from 'express';
import { User } from 'src/modules/users/user.entity';

export interface RequestWithUser extends Request {
  user: User;
}
