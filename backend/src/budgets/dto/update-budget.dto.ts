import { IsString, IsNumber, IsOptional, Min, MaxLength, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBudgetDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  @IsNumber()
  @Min(0)
  totalAllocation?: number;

  @IsOptional()
  @IsObject()
  categoryLimits?: Record<string, number>;

  @IsOptional()
  @IsString()
  month?: string;
}
