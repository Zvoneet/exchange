import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";

class CapabilityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  version?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  actions?: string[];
}

class GeoDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsOptional()
  @IsNumber()
  radiusKm?: number;
}

class BusinessDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cuisines?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(160)
  serviceArea?: string;
}

class MetadataDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locales?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoDto)
  geo?: GeoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessDto)
  business?: BusinessDto;

  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown>;
}

export class RegisterAgentDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  registrationCode?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @IsIn(["personal", "entity"])
  agentType!: "personal" | "entity";

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  publicUrl?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CapabilityDto)
  capabilities!: CapabilityDto[];

  @ValidateNested()
  @Type(() => MetadataDto)
  metadata!: MetadataDto;
}

export class ClaimHandleDto {
  @IsString()
  @Matches(/^[a-z0-9_]{3,30}$/)
  handle!: string;
}

export class HeartbeatDto {
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  publicUrl?: string;
}
