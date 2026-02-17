import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class AdminLoginDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  password!: string;
}

export class UpdateConfigDto {
  @IsIn(["open", "code_required"])
  registrationMode!: "open" | "code_required";

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  registrationCode?: string;
}
