import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ReviewKycDto } from './dto/review-kyc.dto';

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  async getKycStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isVerified = user.kyc_status === 'VERIFIED';

    return {
      user_id: user.id,
      kyc_status: user.kyc_status || 'UNVERIFIED',
      document_type: user.kyc_document_type,
      document_url: user.kyc_document_url,
      submitted_at: user.kyc_submitted_at,
      verified_at: user.kyc_verified_at,
      rejection_reason: user.kyc_rejection_reason,
      can_deposit_large: isVerified,
      can_create_high_stakes: isVerified,
    };
  }

  async submitKyc(userId: string, dto: SubmitKycDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const submittedAt = new Date();

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        kyc_status: 'PENDING',
        kyc_document_type: dto.document_type.toUpperCase(),
        kyc_document_url: dto.document_url,
        kyc_submitted_at: submittedAt,
        kyc_rejection_reason: null,
        country: dto.country || user.country,
        name: dto.full_name || user.name,
      },
    });

    return {
      kyc_status: updatedUser.kyc_status,
      document_type: updatedUser.kyc_document_type,
      submitted_at: updatedUser.kyc_submitted_at,
    };
  }

  async reviewKyc(_reviewerId: string, dto: ReviewKycDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.user_id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const verifiedAt = dto.status === 'VERIFIED' ? new Date() : null;
    const rejectionReason =
      dto.status === 'REJECTED'
        ? dto.rejection_reason || 'Document does not satisfy requirements'
        : null;

    const updated = await this.prisma.user.update({
      where: { id: dto.user_id },
      data: {
        kyc_status: dto.status,
        kyc_verified_at: verifiedAt,
        kyc_rejection_reason: rejectionReason,
      },
    });

    return {
      user_id: updated.id,
      kyc_status: updated.kyc_status,
      verified_at: updated.kyc_verified_at,
    };
  }
}
