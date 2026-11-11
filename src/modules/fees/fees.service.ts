import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateFeeConfigDto } from './dto/update-fee-config.dto';

@Injectable()
export class FeesService {
  constructor(private prisma: PrismaService) {}

  async getFeeConfig() {
    let config = await this.prisma.platformFeeConfig.findFirst({
      orderBy: { created_at: 'desc' },
    });

    if (!config) {
      config = await this.prisma.platformFeeConfig.create({
        data: {
          commission_rate: 10.0,
          applies_to_profit: true,
          description: 'Default platform commission on net winning profit',
        },
      });
    }

    return {
      success: true,
      data: {
        commission_rate: config.commission_rate.toString(),
        applies_to_profit: config.applies_to_profit,
        description: config.description,
        updated_at: config.updated_at,
      },
    };
  }

  async updateFeeConfig(dto: UpdateFeeConfigDto, userId?: string) {
    let config = await this.prisma.platformFeeConfig.findFirst({
      orderBy: { created_at: 'desc' },
    });

    if (config) {
      config = await this.prisma.platformFeeConfig.update({
        where: { id: config.id },
        data: {
          commission_rate: dto.commission_rate,
          description: dto.description ?? config.description,
          updated_by: userId,
        },
      });
    } else {
      config = await this.prisma.platformFeeConfig.create({
        data: {
          commission_rate: dto.commission_rate,
          applies_to_profit: true,
          description:
            dto.description ??
            'Default platform commission on net winning profit',
          updated_by: userId,
        },
      });
    }

    return {
      success: true,
      message: 'Platform commission configuration updated successfully',
      data: {
        commission_rate: config.commission_rate.toString(),
        applies_to_profit: config.applies_to_profit,
        description: config.description,
        updated_at: config.updated_at,
      },
    };
  }
}
