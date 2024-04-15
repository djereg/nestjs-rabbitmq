import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import rabbitmqConfig from "./rabbitmq.config";
import { DiscoveryModule } from "@nestjs/core";
import { EventExplorer } from "./event/event.explorer";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { RabbitMQModule as BaseModule } from "@golevelup/nestjs-rabbitmq";
import { EventListener } from "./event/event.listener";
import { RPCExplorer } from "./rpc/rpc.explorer";
import { RPCListener } from "./rpc/rpc.listener";
import { createClientProviders, RpcClientOptions } from "./rpc/rpc.utils";
import { RabbitMQService } from "./rabbitmq.service";
import { EventEmitter } from "./event/event.emitter";

interface ModuleOptions {
  clients?: RpcClientOptions[];
}

@Module({})
export class RabbitMQModule {

  static forRoot(options?: ModuleOptions): DynamicModule {

    const clients = createClientProviders(options?.clients ?? []);

    return {
      module: RabbitMQModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [rabbitmqConfig]
        }),
        EventEmitterModule.forRoot(),
        DiscoveryModule,
        BaseModule.forRootAsync(BaseModule, {
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {

            const host = config.getOrThrow("rabbitmq.host");
            const port = config.getOrThrow("rabbitmq.port");
            const user = config.getOrThrow("rabbitmq.username");
            const pass = config.getOrThrow("rabbitmq.password");

            const queue = config.getOrThrow("rabbitmq.queue");
            const exchange = config.getOrThrow("rabbitmq.exchange");

            return {
              uri: `amqp://${user}:${pass}@${host}:${port}`,
              channels: {
                "ch-1": {
                  prefetchCount: 1,
                  default: true,
                }
              },
              exchanges: [
                {
                  name: exchange,
                  type: "direct",
                  createExchangeIfNotExists: true
                }
              ],
              queues: [
                {
                  name: queue,
                  createQueueIfNotExists: true
                }
              ],
              enableDirectReplyTo: true,
            };
          }
        })
      ],
      providers: [
        EventEmitter,
        EventExplorer,
        EventListener,
        RPCExplorer,
        RPCListener,
        RabbitMQService,
        ...clients,
      ],
      exports: [
        EventEmitter,
        ...clients,
      ]
    };
  }
}
