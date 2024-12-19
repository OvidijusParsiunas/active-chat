import {RemarkableOptions} from '../../../../types/remarkable';
import {Remarkable} from 'remarkable';
import hljs from 'highlight.js';

declare global {
  interface Window {
    hljs: typeof hljs;
  }
}

export class RemarkableConfig {
  private static readonly DEFAULT_PROPERTIES = {
    breaks: true,
    linkTarget: '_blank', // set target to open in a new tab
  };

  private static instantiate(customConfig?: RemarkableOptions) {
    if (customConfig) {
      return new Remarkable({...RemarkableConfig.DEFAULT_PROPERTIES, ...customConfig});
    } else if (window.hljs) {
      const hljsModule = window.hljs;
      return new Remarkable({
        highlight: function (str, lang) {
          if (lang && hljsModule.getLanguage(lang)) {
            try {
              return hljsModule.highlight(lang, str).value;
            } catch (err) {
              console.error('failed to setup the highlight dependency');
            }
          }
          try {
            return hljsModule.highlightAuto(str).value;
          } catch (err) {
            console.error('failed to automatically highlight messages');
          }
          return ''; // use external default escaping
        },
        html: false, // Enable HTML tags in source
        xhtmlOut: false, // Use '/' to close single tags (<br />)
        breaks: true, // Convert '\n' in paragraphs into <br>
        langPrefix: 'language-', // CSS language prefix for fenced blocks
        linkTarget: '_blank', // set target to open in a new tab
        typographer: true, // Enable smartypants and other sweet transforms
      });
    } else {
      return new Remarkable(RemarkableConfig.DEFAULT_PROPERTIES);
    }
  }

  public static createNew(customConfig?: RemarkableOptions) {
    const remarkable = RemarkableConfig.instantiate(customConfig);
    remarkable.inline.validateLink = () => true;
    return remarkable;
  }
}
