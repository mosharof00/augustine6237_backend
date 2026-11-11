import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

describe('AiController', () => {
  let controller: AiController;
  let service: any;

  beforeEach(async () => {
    service = {
      researchBet: jest.fn().mockResolvedValue({
        bet_id: 'bet_101',
        topic: 'Arsenal vs Chelsea',
        summary: 'Solid form',
      }),
      chat: jest.fn().mockResolvedValue({
        reply: 'Manage risks carefully',
        suggestions: ['Check odds'],
      }),
      getBetInsights: jest.fn().mockResolvedValue({
        bet_id: 'bet_101',
        summary: 'Cached insight',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [{ provide: AiService, useValue: service }],
    }).compile();

    controller = module.get<AiController>(AiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('handles research-bet endpoint', async () => {
    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.researchBet(req, { bet_id: 'bet_101' });
    expect(res.success).toBe(true);
    expect(res.data.bet_id).toBe('bet_101');
    expect(service.researchBet).toHaveBeenCalledWith('u1', {
      bet_id: 'bet_101',
    });
  });

  it('handles chat endpoint', async () => {
    const req = { user: { userId: 'u1' } } as any;
    const res = await controller.chat(req, { query: 'Analyze risks' });
    expect(res.success).toBe(true);
    expect(res.data.reply).toBe('Manage risks carefully');
    expect(service.chat).toHaveBeenCalledWith('u1', { query: 'Analyze risks' });
  });

  it('handles get bet insights endpoint', async () => {
    const res = await controller.getBetInsights('bet_101');
    expect(res.success).toBe(true);
    expect(res.data.summary).toBe('Cached insight');
    expect(service.getBetInsights).toHaveBeenCalledWith('bet_101');
  });
});
