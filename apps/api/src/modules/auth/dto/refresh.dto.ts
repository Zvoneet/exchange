import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class RefreshDto {
  @IsUUID()
  exchangeAgentId!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(500)
  refreshToken!: string;
}
