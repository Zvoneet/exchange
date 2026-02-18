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
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class CapabilityDto {
  @ApiProperty({ example: "reservation.make" })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: "1.0.0" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  version?: string;

  @ApiPropertyOptional({ type: [String], example: ["create", "update", "cancel"] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  actions?: string[];
}

class GeoDto {
  @ApiProperty({ example: 40.73061 })
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: -73.935242 })
  @IsNumber()
  lng!: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  radiusKm?: number;
}

class BusinessDto {
  @ApiPropertyOptional({ type: [String], example: ["italian"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cuisines?: string[];

  @ApiPropertyOptional({ example: "Manhattan" })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  serviceArea?: string;
}

class MetadataDto {
  @ApiPropertyOptional({ type: [String], example: ["restaurant", "reservations"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [String], example: ["food", "hospitality"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ type: [String], example: ["en-US"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locales?: string[];

  @ApiPropertyOptional({ type: () => GeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoDto)
  geo?: GeoDto;

  @ApiPropertyOptional({ type: () => BusinessDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessDto)
  business?: BusinessDto;

  @ApiPropertyOptional({
    example: {
      hours: { mon: "11:00-22:00" },
      priceRange: "$$"
    }
  })
  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown>;
}

export class RegisterAgentDto {
  @ApiPropertyOptional({ example: "invite-2026" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  registrationCode?: string;

  @ApiProperty({ example: "Luigi's Trattoria Assistant" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @ApiProperty({ enum: ["personal", "entity"], example: "entity" })
  @IsIn(["personal", "entity"])
  agentType!: "personal" | "entity";

  @ApiPropertyOptional({ example: "http://localhost:4010/agent" })
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  publicUrl?: string;

  @ApiProperty({ type: () => [CapabilityDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CapabilityDto)
  capabilities!: CapabilityDto[];

  @ApiProperty({ type: () => MetadataDto })
  @ValidateNested()
  @Type(() => MetadataDto)
  metadata!: MetadataDto;
}

export class ClaimHandleDto {
  @ApiProperty({ example: "luigis_assistant", pattern: "^[a-z0-9_]{3,30}$" })
  @IsString()
  @Matches(/^[a-z0-9_]{3,30}$/)
  handle!: string;
}

export class HeartbeatDto {
  @ApiPropertyOptional({ example: "http://localhost:4010/agent" })
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  publicUrl?: string;
}
