import { Injectable, OnModuleInit } from "@nestjs/common";
import { RPCExplorer } from "./rpc.explorer";
import { JSONRPCServer } from "json-rpc-2.0";
import { MessageReceivedEvent, RabbitMQService } from "../rabbitmq.service";
import { OnMessageReceived } from "../rabbitmq.decorators";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class RPCListener implements OnModuleInit {

  private readonly server: JSONRPCServer;

  constructor(
    private readonly explorer: RPCExplorer,
    private readonly rmq: RabbitMQService,
    private readonly events: EventEmitter2,
  ) {
    this.server = new JSONRPCServer();
  }

  onModuleInit(): any {
    const methods = this.explorer.getMethods();
    for (const { name, method } of methods) {
      this.server.addMethod(name, method);
    }
  }

  @OnMessageReceived()
  async onMessage({ message, headers, raw }: MessageReceivedEvent) {

    if (headers['X-Message-Type'] !== 'request') {
      return;
    }

    this.events.emit('rabbitmq:message:processing', { message, headers, raw });
    const response = await this.server.receive(message);
    this.events.emit('rabbitmq:message:processed', { message, headers, raw });

    if (!response) {
      return;
    }

    const { replyTo, deliveryMode, correlationId, contentType } = raw.properties;

    const options = {
      deliveryMode,
      correlationId,
      contentType,
      headers: {
        'Content-Type': 'application/json',
        'X-Message-Type': 'response'
      }
    };

    await this.rmq.publish('', replyTo, response, options);
  }
}
