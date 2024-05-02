import { registerAs } from "@nestjs/config";

export interface RabbitMQConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  vhost: string;
  exchangeName: string;
  exchangeType: string;
  queueName: string;
  prefetchCount: number;
}

export default registerAs<RabbitMQConfig>("rabbitmq", () => ({
  host: process.env.RABBITMQ_HOST ?? 'localhost',
  port: parseInt(process.env.RABBITMQ_PORT ?? '5672'),
  username: process.env.RABBITMQ_USERNAME,
  password: process.env.RABBITMQ_PASSWORD,
  vhost: process.env.RABBITMQ_VHOST ?? "/",
  exchangeName: process.env.RABBITMQ_EXCHANGE_NAME ?? process.env.RABBITMQ_EXCHANGE ?? '',
  exchangeType: process.env.RABBITMQ_EXCHANGE_TYPE ?? 'direct',
  queueName: process.env.RABBITMQ_QUEUE_NAME ?? process.env.RABBITMQ_QUEUE ?? 'default',
  prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH_COUNT ?? '1', 10),
}));
