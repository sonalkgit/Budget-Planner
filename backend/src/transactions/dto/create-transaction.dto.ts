import { IsString, IsNumber, IsIn, IsOptional, Min, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTransactionDto {
  @IsString()
  budgetId: string;

  @IsIn(['income', 'expense'])
  type: 'income' | 'expense';

  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  @IsNumber()
  @Min(0.01, { message: 'Amount must be positive' })
  amount: number;

  @IsString()
  @MaxLength(100)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
