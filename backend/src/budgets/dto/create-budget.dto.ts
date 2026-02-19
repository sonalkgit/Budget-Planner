import { IsString, IsNumber, IsOptional, Min, MaxLength, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBudgetDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  @IsNumber()
  @Min(0, { message: 'Total allocation must be non-negative' })
  totalAllocation: number;

  @IsString()
  month: string;

  @IsOptional()
  @IsObject()
  categoryLimits?: Record<string, number>;
}
