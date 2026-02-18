import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AdminLoginDto {
  @ApiProperty({ minLength: 3, maxLength: 200, example: "admin123" })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  password!: string;
}

export class UpdateConfigDto {
  @ApiProperty({ enum: ["open", "code_required"], example: "open" })
  @IsIn(["open", "code_required"])
  registrationMode!: "open" | "code_required";

  @ApiPropertyOptional({ minLength: 3, maxLength: 255, example: "invite-2026" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  registrationCode?: string;
}
