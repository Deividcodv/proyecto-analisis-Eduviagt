import { Module } from '@nestjs/common';
import { ComitesService } from './comites.service';
import { ComitesController } from './comites.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ComitesController],
  providers: [ComitesService],
  exports: [ComitesService],
})
export class ComitesModule {}