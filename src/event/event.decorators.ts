import { applyDecorators } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { extendArrayMetadata } from "@nestjs/common/utils/extend-metadata.util";

export const RABBITMQ_EVENT = "RABBITMQ_EVENT";

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

export const Event = (event: string): MethodDecorator =>
  applyDecorators(
    AddMetadata(RABBITMQ_EVENT, { event }),
    OnEvent(event)
  );
