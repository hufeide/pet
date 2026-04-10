// Knowledge Sharing Service
// Pet automatically shares interesting knowledge with user

// Knowledge topics categories
const KNOWLEDGE_TOPICS = {
  history: [
    'Did you know that the Great Wall of China is not visible from space with the naked eye?',
    'Ancient Egyptians used tombs as "houses for the dead" to ensure the deceased had a home in the afterlife.',
    'The Roman Empire at its peak controlled over 50 million people across 3 continents.',
    'Marco Polo\'s travels to China introduced many Asians to European culture and goods.',
    'The Library of Alexandria was one of the largest and most significant libraries of the ancient world.',
  ],
  travel: [
    'Banff National Park in Canada is home to the stunning Lake Louise with its turquoise waters.',
    'The Maldives is made up of over 1,000 coral islands and is one of the lowest countries in the world.',
    'Japan\'s cherry blossom season is a famous spring tradition that attracts millions of visitors.',
    'Santorini in Greece is known for its stunning sunsets and white-washed buildings.',
    'The Grand Canyon was carved by the Colorado River over 6 million years.',
  ],
  culture: [
    'In Japan, it is considered polite to finish all the food on your plate.',
    'The tradition of tea ceremonies exists in many cultures, including China, Japan, and Morocco.',
    'Brazil\'s Carnival is considered the largest carnival in the world with millions of participants.',
    'In India, there are over 2,000 festivals celebrated throughout the year.',
    'The Maori haka is a traditional war dance from New Zealand now performed by sports teams.',
  ],
  science: [
    'Honey never spoils - edible honey has been found in ancient Egyptian tombs.',
    'Octopuses have three hearts and blue blood.',
    'The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion.',
    'A day on Venus is longer than a year on Venus.',
    'Bananas are curved because they grow towards the sun (positive geotropism).',
  ],
  science_fiction: [
    'The term "robot" was first used in a 1920 play called "R.U.R." by Karel Capek.',
    'Arthur C. Clarke predicted satellite communications in 1945, 17 years before Telstar 1 was launched.',
    'The first science fiction film was Georges Melies\' "A Trip to the Moon" in 1902.',
    'Isaac Asimov coined the term "robotics" and established the "Three Laws of Robotics".',
    'William Gibson\'s "Neuromancer" (1984) predicted the internet and cybercrime.',
  ],
  literature: [
    'William Shakespeare invented over 1,700 words still used in English today.',
    'Jane Austen\'s "Pride and Prejudice" was originally titled "First Impressions".',
    'The Lord of the Rings trilogy has over 15 million copies sold worldwide.',
    'Harper Lee\'s "To Kill a Mockingbird" won the Pulitzer Prize in 1961.',
    ' Miguel de Cervantes\' "Don Quixote" is considered the first modern novel.',
  ],
  art: [
    'Vincent van Gogh sold only one painting during his lifetime, "The Red Vineyard".',
    'The Mona Lisa has no eyebrows due to Renaissance beauty standards.',
    'Pablo Picasso said "Good artists copy, great artists steal".',
    'The Scream by Edvard Munch sold for $119.9 million in 2012, a record for any artwork.',
    'Claude Monet\'s Water Lilies series consists of over 250 paintings.',
  ],
};

// Get random knowledge from a category
function getRandomKnowledge(category: keyof typeof KNOWLEDGE_TOPICS): string {
  const topics = KNOWLEDGE_TOPICS[category];
  return topics[Math.floor(Math.random() * topics.length)];
}

// Get random knowledge from any category
function getRandomKnowledgeAny(): string {
  const categories = Object.keys(KNOWLEDGE_TOPICS) as Array<keyof typeof KNOWLEDGE_TOPICS>;
  const category = categories[Math.floor(Math.random() * categories.length)];
  return getRandomKnowledge(category);
}

// Check if current time is appropriate for sharing (not nighttime)
function isSharingTime(): boolean {
  const hour = new Date().getHours();
  // sharing time: 8am to 10pm
  return hour >= 8 && hour < 22;
}

// Generate a knowledge share message
export function generateKnowledgeShare(): { topic: string; content: string } {
  const content = getRandomKnowledgeAny();
  // Infer topic from content
  let topic = 'Interesting Fact';

  if (content.includes('Great Wall') || content.includes('Egypt') || content.includes('Roman')) {
    topic = 'History';
  } else if (content.includes('Lake Louise') || content.includes('Maldives') || content.includes('Grand Canyon')) {
    topic = 'Travel';
  } else if (content.includes('Japan') || content.includes('Tea') || content.includes('Brazil') || content.includes('India')) {
    topic = 'Culture';
  } else if (content.includes('Honey') || content.includes('Octopuses') || content.includes('Eiffel')) {
    topic = 'Science';
  } else if (content.includes('Shakespeare') || content.includes('Pride')) {
    topic = 'Literature';
  } else if (content.includes('van Gogh') || content.includes('Mona Lisa') || content.includes('Picasso')) {
    topic = 'Art';
  }

  return { topic, content };
}

// Check if pet should share knowledge (random chance, max 1 per 2-4 hours)
// Can trigger anytime between 8am-10pm, with higher chance at meal times
export function shouldShareKnowledge(lastShareTime: Date | null): boolean {
  // Can only share during daytime (8am-10pm)
  if (!isSharingTime()) return false;

  if (!lastShareTime) return true;

  const now = new Date();
  const diffHours = (now.getTime() - lastShareTime.getTime()) / (1000 * 60 * 60);

  // Share every 2-4 hours randomly
  // Increased chance after 2 hours, maximum chance after 4 hours
  if (diffHours >= 4) return true;
  if (diffHours >= 2 && Math.random() < 0.4) return true;

  return false;
}
