import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { OnMessageReceived } from "../rabbitmq.decorators";
import { MessageReceivedEvent } from "../rabbitmq.service";

@Injectable()
export class EventListener {

  constructor(
    private readonly events: EventEmitter2,
  ) {
    //
  }

  @OnMessageReceived()
  async onMessages({ message, headers, raw }: MessageReceivedEvent) {

    // If the message type is not an event, ignore it
    if (headers["X-Message-Type"] !== "event") {
      return;
    }

    this.events.emit('rabbitmq:message:processing', { message, headers, raw });
    this.events.emit(headers["X-Event-Name"], message);
    this.events.emit('rabbitmq:message:processed', { message, headers, raw });
  }
}
