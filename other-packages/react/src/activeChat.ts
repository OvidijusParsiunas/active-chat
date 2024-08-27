import {ActiveChat as ActiveChatCore} from 'active-chat';
import {createComponent} from '@lit-labs/react';
import * as React from 'react';

export const ActiveChat = createComponent({
  tagName: 'active-chat',
  elementClass: ActiveChatCore,
  react: React,
  events: {
    onactivate: 'activate',
    onchange: 'change',
  },
});
