<template>
  <div class="app">
    <header class="app-header">
      <h1>AI Pet</h1>
      <nav class="nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['nav-btn', { active: currentTab === tab.id }]"
          @click="currentTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>
    </header>

    <main class="app-main">
      <Pet v-if="currentTab === 'pet'" :showStats="true" @start-chat="startPetChat" />
      <Chat
        v-if="currentTab === 'chat'"
        :maxHistory="50"
        :showPetStatus="isChattingWithPet"
        @close-chat="stopPetChat"
      />
      <Adventure v-if="currentTab === 'adventure'" />
      <AdventureUltimate v-if="currentTab === 'ultimate'" />
      <Social v-if="currentTab === 'social'" />
      <Memory v-if="currentTab === 'memory'" />
      <Config v-if="currentTab === 'config'" />
      <PetParadise v-if="currentTab === 'paradise'" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Pet from './components/Pet.vue';
import Chat from './components/Chat.vue';
import Adventure from './components/Adventure.vue';
import AdventureUltimate from './components/AdventureUltimate.vue';
import Social from './components/Social.vue';
import Memory from './components/Memory.vue';
import Config from './components/Config.vue';
import PetParadise from './components/PetParadise.vue';

const currentTab = ref<'pet' | 'chat' | 'adventure' | 'ultimate' | 'social' | 'memory' | 'config' | 'paradise'>('pet');
const isChattingWithPet = ref(false);

const tabs = [
  { id: 'pet' as const, label: 'Pet' },
  { id: 'chat' as const, label: 'Chat' },
  { id: 'adventure' as const, label: 'Adventure' },
  { id: 'ultimate' as const, label: 'Ultimate ⚡' },
  { id: 'social' as const, label: 'Social' },
  { id: 'memory' as const, label: 'Memory' },
  { id: 'config' as const, label: 'Config' },
  { id: 'paradise' as const, label: 'Paradise' },
];

function startPetChat() {
  currentTab.value = 'chat';
  isChattingWithPet.value = true;
}

function stopPetChat() {
  isChattingWithPet.value = false;
  currentTab.value = 'pet';
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    sans-serif;
  background: #f5f5f5;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #1976D2;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.nav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 8px 16px;
  background: rgba(255,255,255,0.2);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.nav-btn:hover {
  background: rgba(255,255,255,0.3);
}

.nav-btn.active {
  background: white;
  color: #1976D2;
  font-weight: 500;
}

.app-main {
  flex: 1;
  overflow: hidden;
}
</style>
