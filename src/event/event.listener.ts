import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { MessageHandler } from "../rabbitmq.decorators";
import { MessageHandleEvent } from "../rabbitmq.service";

@Injectable()
export class EventListener {

  constructor(
    private readonly events: EventEmitter2,
  ) {
    //
  }

  @MessageHandler()
  async onMessages({ message, headers }: MessageHandleEvent) {

    // If the message type is not an event, ignore it
    if (headers["X-Message-Type"] !== "event") {
      return;
    }

    this.events.emit(headers["X-Event-Name"], message);
  }
}
