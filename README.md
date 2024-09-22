# NestJS RabbitMQ

**THIS PACKAGE IS PRIMARILY INTENDED FOR INTERNAL/PRIVATE USE IN OWN PROJECTS.
IF IT MEETS YOUR NEEDS, FEEL FREE TO USE IT, BUT IN CASE OF ANY MODIFICATION REQUESTS, I WILL CONSIDER MY OWN NEEDS FIRST.**

It is still in a very early development phase, so I do not really recommend using it for now,
because anything can change on it at any time and previous functions may break.

The package is part of the [rabbitmq-multiverse](https://github.com/djereg/rabbitmq-multiverse).

# Table of Contents

- [Description](#description)
- [Motivation](#motivation)
- [Usage](#usage)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Module Initialization](#module-initialization)
- [Events](#events)
  - [Emitting events](#emitting-events)
  - [Listening to events](#listening-to-events)
  - [Subscribing to events](#subscribing-to-events)
- [RPC](#rpc)
  - [Setup](#setup)
  - [Calling remote procedures](#calling-remote-procedures)
  - [Registering remote procedures](#registering-remote-procedures)
  - [Notification](#notification)
  - [Batch Call](#batch-call)
- [Lifecycle events](#lifecycle-events)
  - [MessagePublishing](#messagepublishing)
  - [MessageProcessing](#messageprocessing)
  - [MessageProcessed](#messageprocessed)
- [License](#license)

# Description

The package is an intermediate layer between NestJS and RabbitMQ. It provides the possibility of synchronous and asynchronous communication between different microservices.

# Motivation

Since the microservice architecture has become very popular, I needed a library that provides the possibility of communicating with services written in different programming languages or frameworks.

Using the [@golevelup/nestjs-rabbitmq](https://www.npmjs.com/package/@golevelup/nestjs-rabbitmq) package under the hood, which is a great package, but I needed some customizations.

# Usage

## Installation

```bash
$ npm install --save @djereg/nestjs-rabbitmq
```

## Configuration

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

## Module Initialization

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

# Events

Provides an event based asynchronous communication between services.

Works very similarly to the [NestJS event system](https://docs.nestjs.com/techniques/events), as it wraps it. When an event-type message is received, an event is emitted with the help of the built-in event emitter, and the methods listening to the
event perform an action.

## Emitting events

```typescript
import {EventEmitter} from '@djereg/nestjs-rabbitmq';

export class UserService {

  constructor(
    private readonly eventEmitter: EventEmitter
  ) {
    //
  }

  public async createUser(user: User) {
    // Create user logic

    this.eventEmitter.emit('user.created', user);
  }
}
```

## Listening to events

```typescript
import {OnMessageEvent} from '@djereg/nestjs-rabbitmq';

export class NotificationService {

  @OnMessageEvent('user.created')
  public async handleUserCreated(user: User) {
    // Send notification logic
  }
}
```

You can listen to multiple events by adding multiple decorators.

```typescript
@OnMessageEvent('user.created')
@OnMessageEvent('user.updated')
async function handler() {
    // Do something
}
```

## Subscribing to events

At startup the exchange and queue will be created automatically, and the events listening to will be registered as routing keys.

# RPC

Provides the possibility of synchronous like asynchronous communication between services.

Uses the [JSON-RPC 2.0](https://www.jsonrpc.org/specification) protocol for communication.

## Setup

Before using the client, you need to define the client in the module.

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

After initialization, you can use the client in a service.

## Calling remote procedures

Inject the previously defined client into a service and call the remote procedures like the example below.

```typescript
import {Client, InjectClient} from '@djereg/nestjs-rabbitmq';
import {Injectable} from "@nestjs/common";

@Injectable()
class UserService {

  constructor(
    @InjectClient('users')
    private readonly users: Client
  ) {
    //
  }

  public async createUser(dto: UserCreateDto) {
    const user = this.users.call('create', dto);
    // Do something with the user data returned
  }
}
```

## Registering remote procedures

Create a service and add the `@RemoteProcedure` decorator to the method you want to expose.

Adding the decorator without parameters will use the method name as the remote procedure name.
Specifying the name explicitly will use the specified name.

```typescript
import {RemoteProcedure} from '@djereg/nestjs-rabbitmq';

class UserService {

  @RemoteProcedure()
  create(dto: CreateUserDto) {
    // Create a user and return it
  }

  // Also you can specify the method name explicitly
  @RemoteProcedure('delete')
  deleteUserMethod(id: number) {
    // Delete the user somehow
  }
}

```

## Notification

An asynchronous call to the method of service which does not return a result.

```typescript
import {Client, InjectClient} from '@djereg/nestjs-rabbitmq';

class UserController {

  constructor(
    @InjectClient('notifications')
    private readonly notifications: Client
  ) {
    //
  }

  public async createUser(dto: UserCreateDto) {
    // Create the user and notify the notification service
    this.notifications.notify('userCreated', user);
  }
}
```

## Batch Call

A grouped call to multiple methods of service. Returns a list of results.

```typescript
import {Client, InjectClient} from '@djereg/nestjs-rabbitmq';
import {Injectable} from "@nestjs/common";

@Injectable()
class Mathervice {

  constructor(
    @InjectClient('math')
    private readonly math: Client
  ) {
    //
  }

  public async batchCall() {

    const batch = this.math.batch();

    batch.call('add', {a: 1, b: 2});
    batch.call('subtract', {a: 5, b: 3});
    batch.call('multiply', {a: 2, b: 3});
    batch.call('divide', {a: 6, b: 2});

    // The notification method can also be used in the
    // batch, but it will not return a result
    batch.notify('something', {a: 1, b: 2});
    batch.notify('anything', {a: 1, b: 2});

    const results = await batch.send();

    // Do something with the results
  }
}
```

# Lifecycle events

The package emits events during the message processing.
You can listen to these events and perform some actions.

Add the corresponding decorator to the method you want to execute.

## MessagePublishing

Emitted before the message is published to the exchange.

```typescript
import {OnMessagePublishing, MessagePublishingEvent} from '@djereg/nestjs-rabbitmq';

class UserService {

  @OnMessagePublishing()
  async handlePublishing(event: MessagePublishingEvent) {
    // Do something with the event
  }
}
```

## MessageProcessing

Emitted before the message is processed.

```typescript
import {OnMessageProcessing, MessageProcessingEvent} from '@djereg/nestjs-rabbitmq';

class UserService {

  @OnMessageProcessing()
  async handleProcessing(event: MessageProcessingEvent) {
    // Do something with the event
  }
}
```

## MessageProcessed

Emitted after the message is processed.

```typescript
import {OnMessageProcessed, MessageProcessedEvent} from '@djereg/nestjs-rabbitmq';

class UserService {

  @OnMessageProcessed()
  async handleProcessed(event: MessageProcessedEvent) {
    // Do something with the event
  }
}
```

# License

[MIT licensed](LICENSE)
