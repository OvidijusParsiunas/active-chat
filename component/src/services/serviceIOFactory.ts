import {BaseServiceIO} from './utils/baseServiceIO';
import {ActiveChat} from '../activeChat';
import {ServiceIO} from './serviceIO';

// exercise caution when defining default returns for directConnection as their configs can be undefined
export class ServiceIOFactory {
  // this should only be called when no _activeService is set or is demo as otherwise we don't want to reconnect
  public static create(activeChat: ActiveChat): ServiceIO {
    const {connect, demo} = activeChat;
    if (connect && !(demo && connect.stream)) {
      return new BaseServiceIO(activeChat);
    }
    // when connect not defined, we default to demo
    return new BaseServiceIO(activeChat, undefined, demo || true);
  }
}
