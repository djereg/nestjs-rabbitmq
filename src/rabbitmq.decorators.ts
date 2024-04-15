import { OnEvent } from "@nestjs/event-emitter";

export const MessagePublishing = (): MethodDecorator =>
  OnEvent('rabbitmq:publishing');

export const MessageReceived = (): MethodDecorator =>
  OnEvent('rabbitmq:received');

export const MessageHandler = (): MethodDecorator =>
  OnEvent('rabbitmq:handle');
