import { Inject, SetMetadata } from '@nestjs/common';
import { getClientToken } from "./rpc.utils";

export const RABBITMQ_RPC = 'RABBITMQ_RPC';

export interface MethodMetadata {
  name?: string;
}

export const Method = (name?: string): MethodDecorator =>
  SetMetadata(RABBITMQ_RPC, { name });

export const InjectClient = (name: string): ParameterDecorator =>
  Inject(getClientToken(name));
