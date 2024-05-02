import { applyDecorators } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { extendArrayMetadata } from "@nestjs/common/utils/extend-metadata.util";
import { OnEventOptions } from "@nestjs/event-emitter/dist/interfaces";

export const RABBITMQ_MESSAGE_EVENT = "RABBITMQ_MESSAGE_EVENT";

export interface EventMetadata {
  event: string;
}

const AddMetadata = (metadataKey: string, metadata: any) => {
  const factory = (target: object, key?: any, descriptor?: any) => {
    extendArrayMetadata(metadataKey, [metadata], descriptor.value);
    return descriptor;
  };
  factory.KEY = metadataKey;
  return factory;
};

export const OnMessageEvent = (event: string, options?: OnEventOptions): MethodDecorator =>
  applyDecorators(
    AddMetadata(RABBITMQ_MESSAGE_EVENT, { event }),
    OnEvent(event, options)
  );
