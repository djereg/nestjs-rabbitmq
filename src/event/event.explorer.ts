import { Injectable, Type } from "@nestjs/common";
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import { RABBITMQ_EVENT, EventMetadata } from "./event.decorators";
import { castArray } from "lodash";

@Injectable()
export class EventExplorer {

  constructor(
    private readonly reflector: Reflector,
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner
  ) {
    //
  }

  public getEvents(): string[] {
    const p = this.discovery.getProviders()
      .filter((wrapper: InstanceWrapper) => {
        return wrapper.instance && !wrapper.isAlias;
      });

    const events: string[] = [];

    p.forEach((wrapper: InstanceWrapper) => {
      const prototype = Object.getPrototypeOf(wrapper.instance);
      const methods = this.scanner.getAllMethodNames(prototype);

      for (const method of methods) {
        const target = wrapper.instance[method];
        const metas = this.getEventHandlerMetadata(target);

        for (const { event } of metas) {
          events.push(event);
        }
      }
    });

    return events;
  }

  getEventHandlerMetadata(target: Type<unknown>): EventMetadata[] {
    // Circumvent a crash that comes from reflect-metadata if it is
    // given a non-object non-function target to reflect upon.
    if (typeof target !== "function" && typeof target !== "object") {
      return [];
    }

    const metadata = this.reflector.get(RABBITMQ_EVENT, target);
    return castArray(metadata ?? []);
  }
}
