import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventExplorer } from "./event/event.explorer";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AmqpConnection, RequestOptions } from "@golevelup/nestjs-rabbitmq";
import { ConsumeMessage, Options } from "amqplib";

export interface MessagePublishingEvent<M = any, H = any> {
  exchange: string;
  routingKey: string;
  message: M;
  headers: H;
}

export interface MessageReceivedEvent<M = any, H = any> {
  message: M;
  headers: H;
  raw: ConsumeMessage;
}

export interface MessageHandleEvent<M = any, H = any> {
  message: M;
  headers: H;
  raw: ConsumeMessage;
}

@Injectable()
export class RabbitMQService implements OnModuleInit {

  constructor(
    private readonly config: ConfigService,
    private readonly events: EventEmitter2,
    private readonly explorer: EventExplorer,
    private readonly connection: AmqpConnection,
  ) {
    //
  }

  public async publish<M = any>(exchange: string, routingKey: string, message: M, options?: Options.Publish): Promise<boolean> {
    const { headers } = options ?? {};
    const event: MessagePublishingEvent = { exchange, routingKey, message, headers };
    this.events.emit('rabbitmq:publishing', event);

    return this.connection.publish<M>(exchange, routingKey, message, options);
  }

  public async request<T>(options: RequestOptions): Promise<T> {
    const { exchange, routingKey, payload: message, headers } = options;
    const event: MessagePublishingEvent = { exchange, routingKey, message, headers };
    this.events.emit('rabbitmq:publishing', event);

    return this.connection.request<T>(options);
  }

  async onModuleInit(): Promise<void> {
    const events = this.explorer.getEvents();

    const queue = this.config.getOrThrow("rabbitmq.queue");
    const exchange = this.config.getOrThrow("rabbitmq.exchange");

    const channel = this.connection.channel;
    for (const event of events) {
      await channel.bindQueue(queue, exchange, event);
    }

    const handler = async (message: any, raw?: ConsumeMessage, headers?: any) => {
      this.events.emit("rabbitmq:received", { message, headers, raw } as MessageReceivedEvent);
      this.events.emit("rabbitmq:handle", { message, headers, raw } as MessageHandleEvent);
    };

    await this.connection.createSubscriber(handler, { queue }, "messageHandler");
  }
}
