import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StorageModule } from '../../services/storage/storage.module';
import { ConnectionsModule } from '../connections/connections.module';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { MessagesService } from './messages.service';

@Module({
  imports: [ConnectionsModule, StorageModule, JwtModule.register({})],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    MessagesGateway,
    { provide: 'MESSAGES_GATEWAY', useExisting: MessagesGateway },
  ],
  exports: [MessagesService, MessagesGateway, 'MESSAGES_GATEWAY'],
})
export class MessagesModule {}
