# Feature: 统一Pet状态管理

## Goal
统一 Pet.vue、Chat.vue、PetParadise.vue 三个标签页的宠物状态管理，确保所有页面显示一致的宠物状态。

## Requirements

### 1. 统一状态数据源
- 当前问题：Pet.vue使用pet.ts（4个状态），Chat.vue混合使用pet.ts和pet-kingdom.ts，PetParadise.vue使用pet-kingdom.ts（9个状态）
- 解决方案：所有页面统一使用pet-kingdom.ts中的petStatus作为唯一数据源

### 2. 统一状态显示
所有页面应显示相同的9个状态：
- ❤️ Happiness (幸福)
- 🍗 Hunger (饥饿)
- ❤️ Health (健康)
- ⚡ Energy (能量)
- 💤 Sleep (睡眠)
- ⚽ Play (玩耍)
- 💖 Love (爱意)
- 💬 Chat (聊天)
- 📚 Knowledge (知识)

### 3. 统一操作功能
所有页面应支持相同的操作：
- Feed (喂食) - 增加Hunger
- Sleep (睡眠) - 增加Sleep
- Play (玩耍) - 增加Play
- Love (亲昵) - 增加Love
- Chat (聊天) - 增加Chat
- Learn (学习) - 增加Knowledge
- Self Care (自我照顾) - 大模型驱动的自我照顾

### 4. 大模型驱动
- Pet应该记住自己的状态和会话历史
- Pet应该根据当前状态提供相关的回复
- Pet应该能主动请求满足需求

## Acceptance Criteria
- [ ] Pet.vue使用pet-kingdom.ts的petStatus
- [ ] Chat.vue使用pet-kingdom.ts的petStatus
- [ ] PetParadise.vue保持现有实现
- [ ] 所有页面显示相同的9个状态
- [ ] 所有操作功能在所有页面一致
- [ ] Chat中Pet能记住自己的状态和会话历史

## Technical Notes

### Files to Modify
1. **src/store/pet.ts** - 添加对pet-kingdom store的引用
2. **src/components/Pet.vue** - 使用pet-kingdom的petStatus
3. **src/components/Chat.vue** - 使用pet-kingdom的petStatus
4. **src/components/PetParadise.vue** - 保持现有实现，确保与其他页面一致
