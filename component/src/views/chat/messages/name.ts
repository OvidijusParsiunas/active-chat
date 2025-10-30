import {Names, Name as NameT, CustomNames} from '../../../types/names';
import {DEFAULT} from '../../../utils/consts/inputConstants';
import {MessageUtils} from './utils/messageUtils';
import {Role} from './role';

export class Name extends Role {
  private readonly _names: Names;

  constructor(names: Names) {
    super('name');
    this._names = names;
  }

  public addBesideBubble(messageText: HTMLElement, role: string) {
    const customConfig = typeof this._names === 'boolean' ? {} : this._names;
    const nameElement = this.createName(role, customConfig);
    const position = Name.getPosition(role, customConfig);
    nameElement.classList.add(position === 'start' ? 'start-item-position' : 'end-item-position');
    messageText.insertAdjacentElement(position === 'start' ? 'beforebegin' : 'afterend', nameElement);
  }

  private createName(role: string, names: CustomNames) {
    const element = document.createElement('div');
    element.classList.add(this.className);
    element.textContent = Name.getNameText(role, names);
    Name.applyStyle(element, role, names);
    return element;
  }

  private static getPosition(role: string, names: CustomNames) {
    let position: NameT['position'] | undefined = names?.[role]?.position;
    if (role !== MessageUtils.USER_ROLE) position ??= names?.ai?.position;
    position ??= names?.[DEFAULT]?.position;
    position ??= role === MessageUtils.USER_ROLE ? 'end' : 'start';
    return position;
  }

  private static applyStyle(element: HTMLElement, role: string, names: CustomNames) {
    Object.assign(element.style, names[DEFAULT]?.style);
    if (role === MessageUtils.USER_ROLE) {
      Object.assign(element.style, names.user?.style);
    } else {
      Object.assign(element.style, names.ai?.style);
      Object.assign(element.style, names[role]?.style);
    }
  }

  private static getNameText(role: string, names: CustomNames) {
    if (role === MessageUtils.USER_ROLE) {
      return names.user?.text || names[DEFAULT]?.text || 'User';
    }
    if (role === MessageUtils.AI_ROLE) {
      return names.ai?.text || names[DEFAULT]?.text || 'AI';
    }
    return names[role]?.text || names[DEFAULT]?.text || role;
  }
}
