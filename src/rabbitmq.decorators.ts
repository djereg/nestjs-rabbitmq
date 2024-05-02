import { OnEvent } from "@nestjs/event-emitter";

export const OnMessagePublishing = (): MethodDecorator =>
  OnEvent('rabbitmq:message:publishing');

export const OnMessageReceived = (): MethodDecorator =>
  OnEvent('rabbitmq:message:received');

export const OnMessageProcessing = (): MethodDecorator =>
  OnEvent('rabbitmq:message:processing');

export const OnMessageProcessed = (): MethodDecorator =>
  OnEvent('rabbitmq:message:processed');
