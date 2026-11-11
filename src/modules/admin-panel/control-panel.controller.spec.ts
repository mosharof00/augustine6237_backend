import { Test, TestingModule } from '@nestjs/testing';
import { ControlPanelController } from './control-panel.controller';
import { ControlPanelService } from './control-panel.service';

describe('ControlPanelController', () => {
  let controller: ControlPanelController;
  let service: any;

  beforeEach(async () => {
    service = {
      getOverview: jest.fn().mockResolvedValue({ total_users: 1250 }),
      getUsers: jest.fn().mockResolvedValue([{ id: 'u1', name: 'Alex' }]),
      updateUserStatus: jest
        .fn()
        .mockResolvedValue({ user_id: 'u1', status: 'SUSPENDED' }),
      featureBet: jest
        .fn()
        .mockResolvedValue({ bet_id: 'b1', is_featured: true }),
      getPendingWithdrawals: jest
        .fn()
        .mockResolvedValue([{ id: 'tx1', amount: 100 }]),
      reviewWithdrawal: jest
        .fn()
        .mockResolvedValue({ transaction_id: 'tx1', status: 'COMPLETED' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ControlPanelController],
      providers: [{ provide: ControlPanelService, useValue: service }],
    }).compile();

    controller = module.get<ControlPanelController>(ControlPanelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('handles getOverview', async () => {
    const res = await controller.getOverview();
    expect(res.success).toBe(true);
    expect(res.data.total_users).toBe(1250);
  });

  it('handles getUsers', async () => {
    const res = await controller.getUsers('alex', 'ACTIVE', 1, 10);
    expect(res.success).toBe(true);
    expect(service.getUsers).toHaveBeenCalledWith({
      search: 'alex',
      status: 'ACTIVE',
      page: 1,
      limit: 10,
    });
  });

  it('handles updateUserStatus', async () => {
    const res = await controller.updateUserStatus('u1', {
      status: 'SUSPENDED',
    });
    expect(res.success).toBe(true);
    expect(service.updateUserStatus).toHaveBeenCalledWith('u1', {
      status: 'SUSPENDED',
    });
  });

  it('handles featureBet', async () => {
    const res = await controller.featureBet('b1', { is_featured: true });
    expect(res.success).toBe(true);
    expect(service.featureBet).toHaveBeenCalledWith('b1', {
      is_featured: true,
    });
  });

  it('handles getPendingWithdrawals', async () => {
    const res = await controller.getPendingWithdrawals();
    expect(res.success).toBe(true);
    expect(service.getPendingWithdrawals).toHaveBeenCalled();
  });

  it('handles reviewWithdrawal', async () => {
    const res = await controller.reviewWithdrawal('tx1', {
      action: 'APPROVED',
    });
    expect(res.success).toBe(true);
    expect(service.reviewWithdrawal).toHaveBeenCalledWith('tx1', {
      action: 'APPROVED',
    });
  });
});
