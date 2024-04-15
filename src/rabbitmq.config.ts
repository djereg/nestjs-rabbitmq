import { registerAs } from "@nestjs/config";

export default registerAs("rabbitmq", () => ({
  host: process.env.RABBITMQ_HOST,
  port: process.env.RABBITMQ_PORT ?? "5672",
  username: process.env.RABBITMQ_USERNAME,
  password: process.env.RABBITMQ_PASSWORD,
  vhost: process.env.RABBITMQ_VHOST ?? "/",
  exchange: process.env.RABBITMQ_EXCHANGE,
  queue: process.env.RABBITMQ_QUEUE
}));
