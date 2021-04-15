import App from './App.svelte';

const fs = require('fs')


if (!fs.existsSync('/.CANDY')){
  fs.mkdirSync('/.CANDY');
}

if (!fs.existsSync('/.CANDY/db')){
  fs.mkdirSync('/.CANDY/db');
}

const app = new App({
  target: document.getElementById('root'),
  props: {
  }
})

export default app;
