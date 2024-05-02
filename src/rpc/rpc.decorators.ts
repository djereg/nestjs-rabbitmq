import { Inject, SetMetadata } from '@nestjs/common';
import { getClientToken } from "./rpc.utils";

export const RABBITMQ_REMOTE_PROCEDURE = 'RABBITMQ_REMOTE_PROCEDURE';

export interface MethodMetadata {
  name?: string;
}

export const RemoteProcedure = (name?: string): MethodDecorator =>
  SetMetadata(RABBITMQ_REMOTE_PROCEDURE, { name });

export const InjectClient = (name: string): ParameterDecorator =>
  Inject(getClientToken(name));
