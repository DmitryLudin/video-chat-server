export interface ICreateRoomDto {
  ownerId: number;
}

export interface ICreateMemberDto {
  userId: number;
  displayName?: string;
}
