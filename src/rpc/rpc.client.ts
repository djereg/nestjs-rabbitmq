import { JSONRPCClient, createJSONRPCRequest, createJSONRPCNotification, JSONRPCID, JSONRPCResponse } from "json-rpc-2.0";
import { RequestOptions } from "@golevelup/nestjs-rabbitmq";
import { randomUUID } from "crypto";
import { RPC_DEFAULT_TIMEOUT } from "./rpc.utils";
import { RabbitMQService } from "../rabbitmq.service";

interface Batch {
  call: (method: string, params?: any, id?: JSONRPCID) => void;
  notify: (method: string, params?: any) => void;
  send: (options?: Options) => Promise<JSONRPCResponse[]>;
}

export interface Options {
  timeout?: number;
}

export class RPCClient {

  private readonly client: JSONRPCClient<any>;
  private nextId: number = 0;

  constructor(
    private readonly queue: string,
    private readonly rmq: RabbitMQService,
  ) {
    this.client = new JSONRPCClient(
      this.onRequest.bind(this),
      this.getNextId.bind(this)
    );
  }

  public async call<T = any>(method: string, params?: any, options?: Options): Promise<T> {
    return this.client
      .timeout(options?.timeout ?? RPC_DEFAULT_TIMEOUT)
      .request(method, params, options);
  }

  public async notify(method: string, params?: any, options?: Options): Promise<void> {
    return this.client.notify(method, params, options);
  }

  public batch(): Batch {
    const batch: any[] = [];
    return {
      call: (method: string, params?: any, id?: JSONRPCID): void => {
        batch.push(createJSONRPCRequest(id ?? this.getNextId(), method, params));
      },
      notify: (method: string, params?: any): void => {
        batch.push(createJSONRPCNotification(method, params));
      },
      send: async (options?: Options): Promise<JSONRPCResponse[]> => {
        return this.client
          .timeout(options?.timeout ?? RPC_DEFAULT_TIMEOUT)
          .requestAdvanced(batch, options);
      }
    };
  }

  private getNextId(): number {
    return ++this.nextId;
  }

  private async onRequest(payload: any, options?: Options): Promise<any> {

    // Generate a unique identifier for the request
    const correlationId = randomUUID();

    const timeout = options?.timeout ?? RPC_DEFAULT_TIMEOUT;

    const request: RequestOptions = {
      timeout,
      payload,
      correlationId,
      routingKey: this.queue,
      exchange: '',
      expiration: timeout / 2,
      headers: {
        "X-Message-Type": "request",
        'Content-Type': 'application/json',
      },
    };

    const response = await this.rmq.request<any>(request);

    this.client.receive(response);
  }
}
