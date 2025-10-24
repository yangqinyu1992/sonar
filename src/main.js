import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { registerMicroApps, start } from 'qiankun';

registerMicroApps([
  {
    name: 'VueMicroApp',
    entry: '//localhost:5174',
    container: '#react-container',
    activeRule: '/react',
  },
]);

start();

createApp(App).mount('#app')
