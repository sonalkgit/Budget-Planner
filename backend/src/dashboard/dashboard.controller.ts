import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary for a specific budget' })
  @ApiQuery({ name: 'budgetId', required: true })
  @ApiResponse({ status: 200, description: 'Summary successfully retrieved' })
  getSummary(@CurrentUser() user: User, @Query('budgetId') budgetId: string) {
    return this.dashboardService.getBudgetSummary(user.id, budgetId);
  }
}
