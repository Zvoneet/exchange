import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
  @ApiProperty({ example: 40.73061 })
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: -73.935242 })
  @IsNumber()
  lng!: number;

  @ApiProperty({ minimum: 0.1, maximum: 1000, example: 10 })
  @IsNumber()
  @Min(0.1)
  @Max(1000)
  radiusKm!: number;
}

class RequesterGeoDto {
  @ApiProperty({ example: 40.73061 })
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: -73.935242 })
  @IsNumber()
  lng!: number;
}

class RequesterContextDto {
  @ApiPropertyOptional({ type: () => RequesterGeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RequesterGeoDto)
  geo?: RequesterGeoDto;

  @ApiPropertyOptional({ example: "en-US" })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ example: "America/New_York" })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class StructuredSearchDto {
  @ApiPropertyOptional({ example: "reservation.make" })
  @IsOptional()
  @IsString()
  capability?: string;

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

  @ApiPropertyOptional({ example: "italian" })
  @IsOptional()
  @IsString()
  cuisine?: string;

  @ApiPropertyOptional({ type: () => GeoFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoFilterDto)
  geo?: GeoFilterDto;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class IntentSearchDto {
  @ApiProperty({ example: "book an Italian restaurant near me at 7pm on Tuesday" })
  @IsString()
  query!: string;

  @ApiPropertyOptional({ type: () => RequesterContextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RequesterContextDto)
  requesterContext?: RequesterContextDto;
}
