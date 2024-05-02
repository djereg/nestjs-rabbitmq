import { Injectable, Type } from "@nestjs/common";
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import { MethodMetadata, RABBITMQ_REMOTE_PROCEDURE } from "./rpc.decorators";
import { castArray } from "lodash";

export interface MethodMeta {
  name: string;
  method: (...args: any[]) => any | Promise<any>;
}

@Injectable()
export class RPCExplorer {

  constructor(
    private readonly reflector: Reflector,
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
  ) {
    //
  }

  public getMethods(): MethodMeta[] {
    const p = this.discovery.getProviders()
      .filter((wrapper: InstanceWrapper) => {
        return wrapper.instance && !wrapper.isAlias;
      });

    const found: MethodMeta[] = [];

    p.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper;
      const prototype = Object.getPrototypeOf(instance);
      const methods = this.scanner.getAllMethodNames(prototype);

      for (const method of methods) {
        const target = instance[method];
        const metas = this.getEventHandlerMetadata(target);

        for (const { name } of metas) {
          found.push({
            name: name ?? method,
            method: (...args: any[]) => target.call(instance, ...args)
          });
        }
      }
    });

    return found;
  }

  getEventHandlerMetadata(target: Type<unknown>): MethodMetadata[] {

    // Circumvent a crash that comes from reflect-metadata if it is
    // given a non-object non-function target to reflect upon.
    if (typeof target !== "function" && typeof target !== "object") {
      return [];
    }

    const metadata = this.reflector.get(RABBITMQ_REMOTE_PROCEDURE, target);
    return castArray(metadata ?? []);
  }
}
