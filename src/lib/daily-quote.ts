export type Quote = { text: string; author: string };

const QUOTES: readonly [Quote, ...Quote[]] = [
  {
    text: "Eat that frog first thing in the morning, and nothing worse will happen to you the rest of the day.",
    author: "Brian Tracy",
  },
  {
    text: "There is nothing so useless as doing efficiently that which should not be done at all.",
    author: "Peter Drucker",
  },
  {
    text: "It is not a daily increase, but a daily decrease. Hack away at the inessential.",
    author: "Bruce Lee",
  },
  {
    text: "How we spend our days is, of course, how we spend our lives.",
    author: "Annie Dillard",
  },
  {
    text: "It is not that we have a short time to live, but that we waste much of it.",
    author: "Seneca",
  },
  {
    text: "Things which matter most must never be at the mercy of things which matter least.",
    author: "Johann Wolfgang von Goethe",
  },
  {
    text: "What gets measured gets managed.",
    author: "Peter Drucker",
  },
  {
    text: "You will never change your life until you change something you do daily.",
    author: "John C. Maxwell",
  },
  {
    text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.",
    author: "Stephen King",
  },
  {
    text: "Absorb what is useful, discard what is useless, and add what is specifically your own.",
    author: "Bruce Lee",
  },
  {
    text: "The key to success is action, and the essential in action is perseverance.",
    author: "Sun Yat-sen",
  },
  {
    text: "Until we can manage time, we can manage nothing else.",
    author: "Peter Drucker",
  },
];

export function quoteCount(): number {
  return QUOTES.length;
}

export function hashDateKey(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function quoteForDate(key: string, offset = 0): Quote {
  const count = QUOTES.length;
  const step = ((offset % count) + count) % count;
  const index = (hashDateKey(key) + step) % count;
  return QUOTES[index] ?? QUOTES[0];
}
