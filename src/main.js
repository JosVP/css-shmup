import "./styles/main.scss";

// Example DOM interaction to demonstrate HMR for JS (optional)
const el = document.querySelector("h1");
if (import.meta.hot) {
  import.meta.hot.accept();
}
