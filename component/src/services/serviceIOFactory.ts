import {BaseServiceIO} from './utils/baseServiceIO';
import {ActiveChat} from '../activeChat';
import {ServiceIO} from './serviceIO';

export class ServiceIOFactory {
  // this should only be called when no _activeService is set or is demo as otherwise we don't want to reconnect
  public static create(activeChat: ActiveChat): ServiceIO {
    const {connect, demo} = activeChat;
    if (connect && Object.keys(connect).length > 0 && !demo) {
      return new BaseServiceIO(activeChat);
    }
    // when not connect, we default to demo
    return new BaseServiceIO(activeChat, undefined, demo || true);
  }
}
