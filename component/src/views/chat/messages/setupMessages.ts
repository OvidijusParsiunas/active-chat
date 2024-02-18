import {ActiveChat} from '../../../activeChat';

export class SetupMessages {
  public static getText(deepChat: ActiveChat) {
    if (!deepChat.connect && !deepChat.demo) {
      return `Connect to an API using the [connect](https://deepchat.dev/docs/connect#connect-1) property.
        \n To get started checkout the [Start](https://deepchat.dev/start) page and
        live code [examples](https://deepchat.dev/examples/frameworks).
        \n To remove this message set the [demo](https://deepchat.dev/docs/demo#demo) property to true.`;
    } else if (deepChat.connect) {
      // don't forget that when Demo mode is enabled - url is set to 'active-chat-demo'
      if (!deepChat.connect.url && !deepChat.connect.handler) {
        if (deepChat.demo) {
          if (!deepChat.connect.stream) {
            return (
              'When [demo](https://deepchat.dev/docs/demo) mode is enabled - ' +
              'the [connect](https://deepchat.dev/docs/connect#connect-1) ' +
              'object can only accept the [stream](https://deepchat.dev/docs/connect#Stream) property.'
            );
          }
          return null;
        }
        return (
          'Please define a `url` or a `handler` property inside ' +
          'the [connect](https://deepchat.dev/docs/connect#connect-1) object.'
        );
      }
    }
    return null;
  }
}
