import { camelCase, upperFirst } from "lodash";
import { Provider } from "@nestjs/common";
import { RPCClient } from "./rpc.client";
import { RabbitMQService } from "../rabbitmq.service";

export const RPC_DEFAULT_TIMEOUT = 30000;

export function getClientToken(name: string) {
  return 'RPCClient_' + upperFirst(camelCase(name));
}

export interface RpcClientOptions {
  queue: string;
}

export function createClientProviders(options: RpcClientOptions[]): Provider[] {
  return options.map(option => {
    return {
      inject: [RabbitMQService],
      provide: getClientToken(option.queue),
      useFactory: (rmq: RabbitMQService) => {
        return new RPCClient(option.queue, rmq);
      }
    };
  });
}
