import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@ApiTags('budgets')
@ApiBearerAuth()
@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({ status: 201, description: 'Budget created successfully' })
  create(@CurrentUser() user: User, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets for current user' })
  findAll(@CurrentUser() user: User) {
    return this.budgetsService.findAllByUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.budgetsService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update budget' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(id, user, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete budget' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.budgetsService.remove(id, user);
  }
}
