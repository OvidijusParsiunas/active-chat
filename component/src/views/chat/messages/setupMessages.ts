import {ActiveChat} from '../../../activeChat';

export class SetupMessages {
  public static getText(activeChat: ActiveChat) {
    if (!activeChat.connect && !activeChat.demo) {
      return (
        'Connect to an API using the [connect](https://deepchat.dev/docs/connect#connect-1) property. ' +
        '\n To get started checkout the [Start](https://deepchat.dev/start) page and ' +
        'live code [examples](https://deepchat.dev/examples/frameworks).' +
        '\n To remove this message set the [demo](https://deepchat.dev/docs/modes#demo) property to true.'
      );
    } else if (activeChat.connect) {
      // don't forget that when Demo mode is enabled - url is set to 'active-chat-demo'
      if (!activeChat.connect.url && !activeChat.connect.handler) {
        return (
          'Please define a `url` or a `handler` property inside ' +
          'the [connect](https://deepchat.dev/docs/connect#connect-1) object.'
        );
      }
    }
    return null;
  }
}
