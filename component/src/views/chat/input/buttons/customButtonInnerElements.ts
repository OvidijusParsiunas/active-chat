import {ButtonInnerElements, ButtonStateStyles} from '../../../../types/buttonInternal';
import {SVGIconUtils} from '../../../../utils/svg/svgIconUtils';

export class CustomButtonInnerElements {
  private static createTextElement(text: string) {
    const textElement = document.createElement('div');
    textElement.classList.add('text-button');
    textElement.innerText = text;
    return textElement;
  }

  private static createElement(string: string, isText: boolean) {
    return isText ? CustomButtonInnerElements.createTextElement(string) : SVGIconUtils.createSVGElement(string);
  }

  public static createCustomElement<T>(state: keyof T, customStyles?: ButtonStateStyles<T>) {
    const stateStyle = customStyles?.[state];
    if (stateStyle?.text?.content) return CustomButtonInnerElements.createElement(stateStyle?.text?.content, true);
    if (stateStyle?.svg?.content) return CustomButtonInnerElements.createElement(stateStyle?.svg?.content, false);
    return;
  }

  private static processElement(parentEl: HTMLElement, element?: Element) {
    if (!element?.classList.contains('text-button')) {
      parentEl.classList.add('input-button-svg');
    }
  }

  // publicly used for creating elements that do not change state in a sequence
  // prettier-ignore
  public static createSpecificStateElement<T>(
      parentEl: HTMLElement, state: keyof T, customStyles?: ButtonStateStyles<T>) {
    let element: HTMLDivElement | SVGGraphicsElement | undefined;
    if (customStyles) element = CustomButtonInnerElements.createCustomElement(state, customStyles);
    CustomButtonInnerElements.processElement(parentEl, element);
    return element;
  }

  // used for creating elements that change state in a sequence
  // prettier-ignore
  public static create<T>(
      parentEl: HTMLElement, states: (keyof T)[], styles?: ButtonStateStyles<T>): ButtonInnerElements<T> {
    const returnObj: ButtonInnerElements<T> = {};
    if (!styles) {
      CustomButtonInnerElements.processElement(parentEl);
      return returnObj;
    }
    // if the user has specified element for any state, it will be reused for next states
    const initialStateEl = CustomButtonInnerElements.createSpecificStateElement<T>(parentEl, states[0], styles);
    returnObj[states[0]] = initialStateEl;
    let lastStateEl = initialStateEl;
    states.slice(1).forEach((state) => {
      lastStateEl = CustomButtonInnerElements.createCustomElement<T>(state, styles) || lastStateEl;
      returnObj[state] = lastStateEl;
    });
    return returnObj;
  }
}
