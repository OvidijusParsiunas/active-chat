import {EventToFunction, HTMLClassUtility, HTMLClassUtilities} from '../../../../types/html';
import {StatefulEvents} from '../../../../utils/element/statefulEvents';
import {StyleUtils} from '../../../../utils/element/styleUtils';
import {HTMLActiveChatElements} from './htmlActiveChatElements';
import {StatefulStyles} from '../../../../types/styles';
import {MessagesBase} from '../messagesBase';

export class HTMLUtils {
  public static applyStylesToElement(element: HTMLElement, styles: StatefulStyles) {
    const statefulStyles = StyleUtils.processStateful(styles, {}, {});
    StatefulEvents.add(element, statefulStyles);
    Object.assign(element.style, statefulStyles.default);
  }

  private static applyEventsToElement(element: HTMLElement, events: EventToFunction) {
    Object.keys(events).forEach((event) => {
      const eventFunction = events[event];
      if (eventFunction) element.addEventListener(event, eventFunction as () => void);
    });
  }

  private static applyClassUtilitiesToElement(element: HTMLElement, classUtility: HTMLClassUtility) {
    const {events, styles} = classUtility;
    if (events) HTMLUtils.applyEventsToElement(element, events);
    // if active chat class then style was already applied
    if (styles && !HTMLActiveChatElements.doesElementContainActiveChatClass(element)) {
      HTMLUtils.applyStylesToElement(element, styles);
    }
  }

  private static applyCustomClassUtilities(utilities: HTMLClassUtilities, element: HTMLElement) {
    Object.keys(utilities).forEach((className) => {
      const elements = element.getElementsByClassName(className);
      (Array.from(elements) as HTMLElement[]).forEach((element) => {
        if (utilities[className as string]) {
          HTMLUtils.applyClassUtilitiesToElement(element, utilities[className as string]);
        }
      });
    });
  }

  public static apply(messages: MessagesBase, outmostElement: HTMLElement) {
    HTMLActiveChatElements.applyActiveChatUtilities(messages, messages.htmlClassUtilities, outmostElement);
    HTMLUtils.applyCustomClassUtilities(messages.htmlClassUtilities, outmostElement);
  }
}
