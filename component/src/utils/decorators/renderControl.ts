import {InternalHTML} from '../webComponent/internalHTML';

export class RenderControl {
  private static waitForPropertiesToBeUpdatedBeforeRender(internalHTML: InternalHTML) {
    internalHTML._propUpdated_ = false;
    setTimeout(() => {
      if (!internalHTML._propUpdated_) {
        internalHTML._waitingToRender_ = false;
        internalHTML.onRender();
      } else {
        RenderControl.waitForPropertiesToBeUpdatedBeforeRender(internalHTML);
      }
    });
  }

  public static attemptRender(internalHTML: InternalHTML) {
    internalHTML._propUpdated_ = true;
    if (!internalHTML._waitingToRender_) {
      internalHTML._waitingToRender_ = true;
      RenderControl.waitForPropertiesToBeUpdatedBeforeRender(internalHTML);
    }
  }
}
