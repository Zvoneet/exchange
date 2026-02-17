import { Type } from "class-transformer";
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested
} from "class-validator";

class GeoFilterDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsNumber()
  @Min(0.1)
  @Max(1000)
  radiusKm!: number;
}

class RequesterGeoDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}

class RequesterContextDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => RequesterGeoDto)
  geo?: RequesterGeoDto;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class StructuredSearchDto {
  @IsOptional()
  @IsString()
  capability?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsString()
  cuisine?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoFilterDto)
  geo?: GeoFilterDto;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class IntentSearchDto {
  @IsString()
  query!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RequesterContextDto)
  requesterContext?: RequesterContextDto;
}
