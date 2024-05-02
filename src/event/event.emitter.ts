import { Injectable } from "@nestjs/common";
import { RabbitMQService } from "../rabbitmq.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EventEmitter {

  constructor(
    protected readonly rmq: RabbitMQService,
    private readonly config: ConfigService,
  ) {
    //
  }

  public async emit<T extends object = any>(event: string, payload: T) {
    const exchange = this.config.getOrThrow('rabbitmq.exchangeName');
    await this.rmq.publish<T>(exchange, event, payload, {
      headers: {
        'X-Message-Type': 'event',
        'X-Event-Name': event,
        'Content-Type': 'application/json',
      },
      contentType: 'application/json',
      priority: 0,
      persistent: true,
    });
  }
}
