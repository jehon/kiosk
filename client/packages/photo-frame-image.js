export default class PhotoFrameImage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
        <style>
            :host() {
                display: block;
                position: relative;

                width: 100%;
                height: 100%;
            }

            img {
                width: 100%;
                height: 100%;

                background-color: black;
                object-fit: contain;
            }

            div {
                position: absolute;
                bottom: 3em;
                left: 0;

                width: 100%;

                text-align: center;
                text-shadow: 1px 1px 2px black, 0 0 1em grey, 0 0 0.2em grey;
              }
        </style>
        <img src='${this.getAttribute("src")}'>
        <div>
            ${this.getAttribute("title") ?? ""}
            <br>
            ${this.getAttribute("date") ?? ""}
        </div>
    `;
  }
}

customElements.define("photo-frame-image", PhotoFrameImage);
