import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RefreshDto {
  @ApiProperty({ format: "uuid", example: "4dc548f4-43e6-4fa8-8be2-3c194db662cd" })
  @IsUUID()
  exchangeAgentId!: string;

  @ApiProperty({ minLength: 20, maxLength: 500, example: "1e4e65d53f7ce3f..." })
  @IsString()
  @MinLength(20)
  @MaxLength(500)
  refreshToken!: string;
}
