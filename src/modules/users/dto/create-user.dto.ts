export class CreateUserDto {
  password: string;
  username: string;
  displayName?: string;
  avatar?: string;
  isOnline?: boolean;
}
