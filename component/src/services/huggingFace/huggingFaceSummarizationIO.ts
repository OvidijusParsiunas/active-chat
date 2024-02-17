import {HuggingFaceSummarizationResult} from '../../types/huggingFaceResult';
import {HuggingFace} from '../../types/huggingFace';
import {HuggingFaceIO} from './huggingFaceIO';
import {Response} from '../../types/response';
import {ActiveChat} from '../../activeChat';

export class HuggingFaceSummarizationIO extends HuggingFaceIO {
  constructor(deepChat: ActiveChat) {
    const config = deepChat.directConnection?.huggingFace?.summarization as NonNullable<HuggingFace['summarization']>;
    const apiKey = deepChat.directConnection?.huggingFace;
    super(deepChat, 'Insert text to summarize', 'facebook/bart-large-cnn', config, apiKey);
  }

  override async extractResultData(result: HuggingFaceSummarizationResult): Promise<Response> {
    if (result.error) throw result.error;
    return {text: result[0].summary_text || ''};
  }
}
