# First of all

**This package is primarily intended for internal, private use in own projects. If it meets your needs, feel free to use it, but in case of any modification requests, I will consider my own needs first.**

# NestJS RabbitMQ

## Table of Contents

- [Description](#description)
- [Motivation](#motivation)
- [Usage](#usage)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Module Initialization](#module-initialization)
- [Events](#events)
  - [Emitting Event](#emitting-event)
  - [Subscribing to Event](#subscribing-to-event)
- [RPC](#rpc)
  - [Setup](#setup)
  - [Method Call](#method-call)
  - [Notification](#notification)
  - [Batch Call](#batch-call)

## Description

The package is an intermediate layer between NestJS and RabbitMQ. It provides the possibility of synchronous and asynchronous communication between different microservices.

## Motivation

Since the microservice architecture has become very popular, I needed a library that provides the possibility of communicating with services written in different programming languages or frameworks.

Using the [@golevelup/nestjs-rabbitmq](https://www.npmjs.com/package/@golevelup/nestjs-rabbitmq) package under the hood, which is a great package, but I needed some customizations.

## Usage

### Installation

```bash
$ npm install --save @djereg/nestjs-rabbitmq
```

### Configuration

The RabbitMQ connection configuration is done through environment variables.

```dotenv
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
RABBITMQ_QUEUE=
RABBITMQ_EXCHANGE=
```

### Module Initialization

```typescript
import {RabbitMQModule} from "@djereg/nestjs-rabbitmq";

@Module({
  imports: [
    RabbitMQModule.forRoot(),
  ],
})
export class AppModule {
}
```

## Events

Provides an event based asynchronous communication between services.

Works very similarly to the [NestJS event system](https://docs.nestjs.com/techniques/events), as it wraps it. When an event-type message is received, an event is emitted with the help of the built-in event emitter, and the methods subscribed to the
event perform an action.

### Emitting Event

```typescript
import {EventEmitter} from '@djereg/nestjs-rabbitmq';

export class UserService {

  constructor(
    private readonly eventEmitter: EventEmitter
  ) {
  }

  public async createUser(user: User) {
    // Create user logic

    this.eventEmitter.emit('user.created', user);
  }
}
```

### Subscribing to Event

```typescript
import {Event} from '@djereg/nestjs-rabbitmq';

export class NotificationService {

  @Event('user.created')
  public async handleUserCreated(user: User) {
    // Send notification logic
  }
}
```

You can subscribe to multiple events by adding multiple decorators.

```typescript
@Event('user.created')
@Event('user.updated')
async function handler() {

}
```

## RPC

Provides the possibility of synchronous like asynchronous communication between services.

Uses the [JSON-RPC 2.0](https://www.jsonrpc.org/specification) protocol for communication.

### Setup

Before using the client, you need set it up in the module.

```typescript
import {RabbitMQModule} from "@djereg/nestjs-rabbitmq";

@Module({
  imports: [
    RabbitMQModule.forRoot({
      client: [{
        queue: 'users'
      }]
    }),
  ],
})
```

After initialization, you can use the client in the service.

### Method Call

A synchronous-like call to the method of service which returns a result.

```typescript
import {Client, InjectClient} from '@djereg/nestjs-rabbitmq';

class UserController {

  constructor(
    @InjectClient('users')
    private readonly users: Client
  ) {
  }

  public async createUser(dto: UserCreateDto) {
    const user = this.users.call('create', dto);

    // Do something with user
  }
}
```

```typescript
import {Method} from '@djereg/nestjs-rabbitmq';

class UserService {

  @Method()
  create(dto: CreateUserDto) {
    // Create user logic
    const user = db.createUser(dto);

    return user;
  }

  // Also you can specify the method name explicitly
  @Method('delete')
  deleteUserMethod(id: number) {
    // Delete user logic
  }
}

```

### Notification

An asynchronous call to the method of service which does not return a result.

```typescript
import {Client, InjectClient} from '@djereg/nestjs-rabbitmq';

class UserController {

  constructor(
    @InjectClient('notifications')
    private readonly notifications: Client
  ) {
  }

  public async createUser(dto: UserCreateDto) {
    // Create user logic

    this.notifications.notify('userCreated', user);
  }
}
```

### Batch Call

A grouped call to multiple methods of service. Returns a list of results.

```typescript
import {Client, InjectClient} from '@djereg/nestjs-rabbitmq';
import {basename} from "@angular-devkit/core";

class UserController {

  constructor(
    @InjectClient('math')
    private readonly math: Client
  ) {
  }

  public async createUser(dto: UserCreateDto) {

    const batch = this.math.batch();

    batch.call('add', {a: 1, b: 2});
    batch.call('subtract', {a: 5, b: 3});
    batch.call('multiply', {a: 2, b: 3});
    batch.call('divide', {a: 6, b: 2});

    // The notification method can also be used in the
    // batch, but it will not return a result
    batch.notify('somethin', {a: 1, b: 2});
    batch.notify('anything', {a: 1, b: 2});

    const results = await batch.send();

    // Do something with user
  }
}
```

## License

[MIT licensed](LICENSE)
