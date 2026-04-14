import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './index.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.mount('#app');

// Initialize AI narrator after app is mounted (Pinia is now active)
// This must be done after app.use(pinia) and app.mount()
import('./services/ai-narrator').then(({ aiNarrator }) => {
  aiNarrator.initialize().catch(err => {
    console.error('Failed to initialize AI Narrator:', err);
  });
});
