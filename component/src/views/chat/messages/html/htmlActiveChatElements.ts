import {CLICK, DEFAULT, HOVER} from '../../../../utils/consts/inputConstants';
import {StyleUtils} from '../../../../utils/element/styleUtils';
import {TEXT} from '../../../../utils/consts/messageConstants';
import {HTMLClassUtilities} from '../../../../types/html';
import {StatefulStyles} from '../../../../types/styles';
import {MessagesBase} from '../messagesBase';
import {MessageElements} from '../messages';
import {HTMLUtils} from './htmlUtils';

// WORK - update documentation
const ACTIVE_CHAT_TEMPORARY_MESSAGE = 'chat-temporary-message';
const ACTIVE_CHAT_SUGGESTION_BUTTON = 'chat-suggestion-button';

const ACTIVE_CHAT_ELEMENTS: HTMLClassUtilities = {
  'chat-button': {
    styles: {
      [DEFAULT]: {
        backgroundColor: 'white',
        padding: '5px',
        paddingLeft: '7px',
        paddingRight: '7px',
        border: '1px solid #c2c2c2',
        borderRadius: '6px',
        cursor: 'pointer',
      },
      [HOVER]: {
        backgroundColor: '#fafafa',
      },
      [CLICK]: {
        backgroundColor: '#f1f1f1',
      },
    },
  },
};

const ACTIVE_CHAT_ELEMENT_CLASSES = Object.keys(ACTIVE_CHAT_ELEMENTS);

export class HTMLActiveChatElements {
  private static applySuggestionEvent(messages: MessagesBase, element: Element) {
    // needs to be in a timeout for submitMessage to be available
    setTimeout(() => {
      element.addEventListener(CLICK, () => {
        messages.submitUserMessage?.({[TEXT]: element.textContent?.trim() || ''});
      });
    });
  }

  public static isElementTemporary(messageElements?: MessageElements) {
    if (!messageElements) return false;
    return messageElements.bubbleElement.children[0]?.classList.contains(ACTIVE_CHAT_TEMPORARY_MESSAGE);
  }

  public static doesElementContainActiveChatClass(element: HTMLElement) {
    return ACTIVE_CHAT_ELEMENT_CLASSES.find((className) => element.classList.contains(className));
  }

  private static applyEvents(element: Element, className: string) {
    const events = ACTIVE_CHAT_ELEMENTS[className].events;
    Object.keys(events || []).forEach((eventType) => {
      element.addEventListener(eventType, events?.[eventType as keyof GlobalEventHandlersEventMap] as () => void);
    });
  }

  private static getProcessedStyles(utilities: HTMLClassUtilities, element: Element, className: string) {
    const customStyles = Array.from(element.classList).reduce<StatefulStyles[]>((styles, className) => {
      const statefulStyles = utilities[className]?.styles as StatefulStyles;
      if (statefulStyles && utilities[className].styles) {
        styles.push(statefulStyles);
      }
      return styles;
    }, []);
    const activeChatStyles = ACTIVE_CHAT_ELEMENTS[className].styles;
    if (activeChatStyles) {
      const stylesCp = JSON.parse(JSON.stringify(activeChatStyles));
      if (stylesCp[DEFAULT]) StyleUtils.overwriteDefaultWithAlreadyApplied(stylesCp, element as HTMLElement);
      customStyles.unshift(stylesCp); // add it to the front to be primary
    }
    const mergedStyles = StyleUtils.mergeStatefulStyles(customStyles);
    return StyleUtils.processStateful(mergedStyles);
  }

  public static applyActiveChatUtilities(messages: MessagesBase, utilities: HTMLClassUtilities, element: HTMLElement) {
    ACTIVE_CHAT_ELEMENT_CLASSES.forEach((className) => {
      const elements = element.getElementsByClassName(className);
      Array.from(elements || []).forEach((element) => {
        const styles = HTMLActiveChatElements.getProcessedStyles(utilities, element, className);
        HTMLUtils.applyStylesToElement(element as HTMLElement, styles);
        HTMLActiveChatElements.applyEvents(element, className);
      });
    });
    const suggestionElements = element.getElementsByClassName(ACTIVE_CHAT_SUGGESTION_BUTTON);
    Array.from(suggestionElements).forEach((element) => HTMLActiveChatElements.applySuggestionEvent(messages, element));
  }
}
