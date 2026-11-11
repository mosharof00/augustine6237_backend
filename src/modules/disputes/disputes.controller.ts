import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@ApiTags('disputes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @ApiOperation({
    summary: 'File a formal dispute against a bet outcome with evidence',
  })
  @Post()
  async createDispute(@Req() req: Request, @Body() dto: CreateDisputeDto) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    const data = await this.disputesService.createDispute(userId, dto);
    return {
      success: true,
      message: 'Dispute filed successfully and escalated for review',
      data,
    };
  }

  @ApiOperation({
    summary: 'List disputes with optional bet_id, status, and user filtering',
  })
  @ApiQuery({ name: 'bet_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'my_disputes', required: false, type: Boolean })
  @Get()
  async getDisputes(
    @Req() req: Request,
    @Query('bet_id') betId?: string,
    @Query('status') status?: string,
    @Query('my_disputes') myDisputes?: string,
  ) {
    const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
    const isMyDisputes = myDisputes === 'true' || myDisputes === '1';

    const data = await this.disputesService.getDisputes({
      bet_id: betId,
      status,
      creator_id: isMyDisputes ? userId : undefined,
    });
    return {
      success: true,
      message: 'Disputes retrieved successfully',
      data,
    };
  }

  @ApiOperation({
    summary: 'Get full details of a specific dispute',
  })
  @Get(':id')
  async getDisputeById(@Param('id') id: string) {
    const data = await this.disputesService.getDisputeById(id);
    return {
      success: true,
      message: 'Dispute details retrieved',
      data,
    };
  }

  @ApiOperation({
    summary: 'Adjudicate and resolve a dispute',
  })
  @Post(':id/resolve')
  async resolveDispute(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    const resolverId = (req.user as any)?.userId ?? (req.user as any)?.id;
    const data = await this.disputesService.resolveDispute(resolverId, id, dto);
    return {
      success: true,
      message: 'Dispute resolved successfully',
      data,
    };
  }
}
