import { Injectable, OnModuleInit } from "@nestjs/common";
import { RPCExplorer } from "./rpc.explorer";
import { JSONRPCServer } from "json-rpc-2.0";
import { MessageHandleEvent, RabbitMQService } from "../rabbitmq.service";
import { MessageHandler } from "../rabbitmq.decorators";

@Injectable()
export class RPCListener implements OnModuleInit {

  private readonly server: JSONRPCServer;

  constructor(
    private readonly explorer: RPCExplorer,
    private readonly rmq: RabbitMQService,
  ) {
    this.server = new JSONRPCServer();
  }

  onModuleInit(): any {
    const methods = this.explorer.getMethods();
    for (const { name, method } of methods) {
      this.server.addMethod(name, method);
    }
  }

  @MessageHandler()
  async onMessage({ message, headers, raw }: MessageHandleEvent) {

    if (headers['X-Message-Type'] !== 'rpc') {
      return;
    }

    const response = await this.server.receive(message);

    if (!response) {
      return;
    }

    const { replyTo, deliveryMode, correlationId, contentType } = raw.properties;
    const options = { deliveryMode, correlationId, contentType, headers: {} };

    await this.rmq.publish('', replyTo, response, options);
  }
}
