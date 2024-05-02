export { OnMessageEvent } from './event/event.decorators';
export { EventEmitter } from './event/event.emitter';
export { RemoteProcedure, InjectClient } from './rpc/rpc.decorators';
export { RPCClient as Client } from './rpc/rpc.client';
export { RabbitMQModule } from './rabbitmq.module';
export { RabbitMQService } from './rabbitmq.service';
export type {
  MessagePublishingEvent, MessageReceivedEvent, MessageProcessingEvent, MessageProcessedEvent,
} from './rabbitmq.service';
export {
  OnMessagePublishing, OnMessageReceived, OnMessageProcessing, OnMessageProcessed,
} from './rabbitmq.decorators';
