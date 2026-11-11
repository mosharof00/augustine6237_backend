// external imports
import { MiddlewareConsumer, Module } from '@nestjs/common';
// import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
// import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';

// internal imports
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import appConfig from './config/app.config';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
// import { ThrottlerBehindProxyGuard } from './common/guard/throttler-behind-proxy.guard';
import { RequestModule } from 'src/modules/application/request/request.module';
import { AbilityModule } from './ability/ability.module';
import { RepositoryModule } from './common/repository/repository.module';
import { MailModule } from './mail/mail.module';
import { AdminModule } from './modules/admin/admin.module';
import { ApplicationModule } from './modules/application/application.module';
import { ChatModule } from './modules/chat/chat.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PrometheusModule } from './prometheus/prometheus.module';
import { UserProfileModule } from './modules/profile/profile.module';
import { PostsModule } from './modules/posts/posts.module';
import { BetsModule } from './modules/bets/bets.module';
import { FeesModule } from './modules/fees/fees.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { KycModule } from './modules/kyc/kyc.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { GamingModule } from './modules/gaming/gaming.module';
import { AiModule } from './modules/ai/ai.module';
import { AdminPanelModule } from './modules/admin-panel/admin-panel.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    BullModule.forRoot({
      connection: {
        host: appConfig().redis.host,
        password: appConfig().redis.password,
        port: +appConfig().redis.port,
      },
      // redis: {
      //   host: appConfig().redis.host,
      //   password: appConfig().redis.password,
      //   port: +appConfig().redis.port,
      // },
    }),
    RedisModule.forRoot({
      type: 'single',
      options: {
        host: appConfig().redis.host,
        password: appConfig().redis.password,
        port: +appConfig().redis.port,
      },
    }),
    // disabling throttling for dev
    // ThrottlerModule.forRoot([
    //   {
    //     name: 'short',
    //     ttl: 1000,
    //     limit: 3,
    //   },
    //   {
    //     name: 'medium',
    //     ttl: 10000,
    //     limit: 20,
    //   },
    //   {
    //     name: 'long',
    //     ttl: 60000,
    //     limit: 100,
    //   },
    // ]),
    // General modules
    PrismaModule,
    RepositoryModule,
    AuthModule,
    AbilityModule,
    MailModule,
    ApplicationModule,
    AdminModule,
    ChatModule,
    PaymentModule,
    PrometheusModule,
    RequestModule,
    UserProfileModule,
    PostsModule,
    BetsModule,
    FeesModule,
    WalletModule,
    PaymentsModule,
    KycModule,
    DisputesModule,
    GamingModule,
    AiModule,
    AdminPanelModule,
  ],
  controllers: [AppController],
  providers: [
    // disabling throttling for dev
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
    // disbling throttling for dev {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerBehindProxyGuard,
    // },
    AppService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
