
export default class KioskTimedDiv extends HTMLElement {
  #source = '';
  #level = 'info';
  #message = '';
  #json = false;

  connectedCallback() {
    setTimeout(() => {
      // Self destruct:
      this.remove();
    }, 10 * 1000);
  }

  /**
   * @param {string} source to be shown
   * @returns { this } for chaining
   */
  withSource(source) {
    this.#source = source;
    return this;
  }

  /**
   * @param {string} level to be shown
   * @returns { this } for chaining
   */
  withLevel(level) {
    this.#level = level;
    return this;
  }

  /**
   * @param {string} message to be shown
   * @returns { this } for chaining
   */
  withMessage(message) {
    this.#message = message;
    return this;
  }

  /**
   * @param {obj} obj to be shown
   * @returns { this } for chaining
   */
  withJSON(obj) {
    this.#json = obj;
    return this;
  }

  /**
   * @param {HTMLElement} el where to insert element
   * @returns {this} for chaining
   */
  in(el) {

    const d = new Date();
    const ts = ('00' + d.getHours()).substr(-2)
            + ':'
            + ('00' + d.getMinutes()).substr(-2)
            + ':'
            + ('00' + d.getSeconds()).substr(-2);

    this.innerHTML = `
            <div>${ts}: ${this.#level}: ${this.#source}</div>
            ${this.#message ? `<div>${this.#message}</div>` : ''}
            ${this.#json ? `<pre>${JSON.stringify(this.#json, null, 2)}</pre>` : ''}
        `;

    el.insertAdjacentElement('afterbegin', this);
    return this;
  }
}

customElements.define('kiosk-timed-div', KioskTimedDiv);
