import { Module, forwardRef } from '@nestjs/common';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [forwardRef(() => MessagesModule)],
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
