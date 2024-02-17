class CustomElement extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({mode: 'open'});
    const customButton = document.createElement('button');
    customButton.innerText = 'button';
    customButton.onclick = () => {
      this.dispatchEvent(new CustomEvent('custom-event'));
    };
    shadow.appendChild(customButton);
  }
}

customElements.define('custom-element', CustomElement);
