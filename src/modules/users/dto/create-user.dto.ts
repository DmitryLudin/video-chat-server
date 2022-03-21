export class CreateUserDto {
  email: string;
  password: string;
  username: string;
  displayName?: string;
  avatar?: string;
  isOnline?: boolean;
}
