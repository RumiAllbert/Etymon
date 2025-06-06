import { wordSchema } from '@/utils/schema';

describe('wordSchema', () => {
  it('should validate a valid word schema', () => {
    const validData = {
      thought: 'Etymology of the word "photograph"',
      parts: [
        {
          id: 'part1',
          text: 'photo',
          originalWord: 'φωτός',
          origin: 'Greek',
          meaning: 'light',
        },
        {
          id: 'part2',
          text: 'graph',
          originalWord: 'γράφω',
          origin: 'Greek',
          meaning: 'to write/draw',
        },
      ],
      combinations: [
        [
          {
            id: 'combo1',
            text: 'photograph',
            definition: 'An image created by light falling on a photosensitive surface',
            sourceIds: ['part1', 'part2'],
            origin: 'Greek',
          },
        ],
      ],
      similarWords: [
        {
          word: 'photography',
          explanation: 'The art or practice of taking and processing photographs',
          sharedOrigin: 'From the same Greek roots',
        },
        {
          word: 'photogram',
          explanation: 'A picture produced with photographic materials but without a camera',
          sharedOrigin: 'From the same Greek root "photo"',
        },
      ],
    };

    const result = wordSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should validate Greek word data with non-Latin characters', () => {
    const greekWordData = {
      thought: 'From Ancient Greek "φιλοσοφία" (philosophia), combining "φίλος" (philos) meaning "loving" and "σοφία" (sophia) meaning "wisdom"',
      parts: [
        {
          id: 'phil',
          text: 'Φιλο',
          originalWord: 'φίλος',
          origin: 'Ancient Greek',
          meaning: 'loving, fond of',
        },
        {
          id: 'sophia',
          text: 'σοφία',
          originalWord: 'σοφία',
          origin: 'Ancient Greek',
          meaning: 'wisdom, knowledge',
        },
      ],
      combinations: [
        [
          {
            id: 'philosophia',
            text: 'Φιλοσοφία',
            definition: 'the love or pursuit of wisdom and knowledge',
            sourceIds: ['phil', 'sophia'],
          },
        ],
      ],
      similarWords: [
        {
          word: 'φιλόλογος',
          explanation: 'one who loves learning/words (philology)',
          sharedOrigin: 'Greek φίλος (philos) "loving"',
        },
        {
          word: 'φιλάνθρωπος',
          explanation: 'lover of humanity (philanthropy)',
          sharedOrigin: 'Greek φίλος (philos) "loving"',
        },
      ],
    };

    const result = wordSchema.safeParse(greekWordData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid data missing required fields', () => {
    const invalidData = {
      // Missing 'thought' field
      parts: [
        {
          id: 'part1',
          text: 'photo',
          originalWord: 'φωτός',
          origin: 'Greek',
          meaning: 'light',
        },
      ],
      combinations: [
        [
          {
            id: 'combo1',
            text: 'photograph',
            definition: 'An image created by light',
            sourceIds: ['part1'],
          },
        ],
      ],
      similarWords: [
        {
          word: 'photography',
          explanation: 'The art of taking photographs',
          sharedOrigin: 'From the same Greek roots',
        },
      ],
    };

    const result = wordSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid data with wrong types', () => {
    const invalidData = {
      thought: 'Etymology of the word "photograph"',
      parts: [
        {
          id: 'part1',
          text: 'photo',
          originalWord: 'φωτός',
          origin: 'Greek',
          meaning: 123, // Should be a string
        },
      ],
      combinations: [
        [
          {
            id: 'combo1',
            text: 'photograph',
            definition: 'An image created by light',
            sourceIds: ['part1'],
          },
        ],
      ],
      similarWords: [
        {
          word: 'photography',
          explanation: 'The art of taking photographs',
          sharedOrigin: 'From the same Greek roots',
        },
      ],
    };

    const result = wordSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should validate with optional fields', () => {
    const dataWithOptionalFields = {
      thought: 'Etymology of the word "photograph"',
      parts: [
        {
          id: 'part1',
          text: 'photo',
          originalWord: 'φωτός',
          origin: 'Greek',
          meaning: 'light',
        },
      ],
      combinations: [
        [
          {
            id: 'combo1',
            text: 'photograph',
            definition: 'An image created by light',
            sourceIds: ['part1'],
            // origin is optional
          },
        ],
      ],
      similarWords: [
        {
          word: 'photography',
          explanation: 'The art of taking photographs',
          sharedOrigin: 'From the same Greek roots',
        },
      ],
    };

    const result = wordSchema.safeParse(dataWithOptionalFields);
    expect(result.success).toBe(true);
  });
}); 