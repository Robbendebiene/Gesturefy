import { ContentLoaded, Config } from "/views/options/main.js";

ContentLoaded.then(main);

/**
 * main function
 * run code that depends on async resources
 **/
function main () {
  // apply values to input fields and add their event function
  for (let input of document.querySelectorAll("[data-config]")) {
    const value = Config.get(input.dataset.config);
    if (input.type === "checkbox") input.checked = value;
    else input.value = value;
    input.addEventListener('change', onInput);
  }

  // toggle collapsables and add their event function
  for (let collapse of document.querySelectorAll("[data-collapse]")) {
    collapse.addEventListener('change', onCollapse);
    onCollapse.call(collapse);
  }
}


/**
 * save input value if valid
 **/
function onInput () {
  // check if valid, if there is no validity property check if value is set
  if ((this.validity && this.validity.valid) || (!this.validity && this.value)) {
    let value;
    // get true or false for checkboxes
    if (this.type === "checkbox") value = this.checked;
    // get value either as string or number
    else value = isNaN(this.valueAsNumber) ? this.value : this.valueAsNumber;
    // save to config
    Config.set(this.dataset.config, value);
  }
}


/**
 * hide or show on collapse toggle
 **/
function onCollapse (event) {
  const targetElements = document.querySelectorAll(this.dataset["collapse"]);

  for (let element of targetElements) {
    // if user dispatched the function, then hide with animation, else hide without animation
    if (event) {
      element.addEventListener("transitionend", (event) => {
        event.currentTarget.classList.remove("animate");
      }, { once: true });
      element.classList.add("animate");

      if (!this.checked) {
        element.style.height = element.scrollHeight + "px";
        // trigger reflow
        element.offsetHeight;
      }
    }

    if (element.style.height === "0px" && this.checked)
      element.style.height = element.scrollHeight + "px";

    else if (!this.checked)
      element.style.height = "0px";
  }
}
