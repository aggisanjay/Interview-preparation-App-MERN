import mongoose from 'mongoose';
import 'dotenv/config';
import Question from './models/Question.js';
import User     from './models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/interview_prep';

const questions = [
  // ── JavaScript ────────────────────────────────────────────────────────────
  {
    type: 'mcq', topic: 'JavaScript', difficulty: 'Easy',
    title: 'What does typeof null return?',
    description: 'What does the typeof operator return when applied to null?',
    options: [
      { label: 'A', text: '"null"' },
      { label: 'B', text: '"object"' },
      { label: 'C', text: '"undefined"' },
      { label: 'D', text: '"boolean"' },
    ],
    correctAnswer: 'B',
    solutionExplanation:
      'typeof null === "object" is a long-standing JS quirk present since the first version.',
    tags: ['typeof', 'null', 'primitives'],
  },
  {
    type: 'mcq', topic: 'JavaScript', difficulty: 'Medium',
    title: 'What is a closure in JavaScript?',
    description: 'Which statement best describes a closure?',
    options: [
      { label: 'A', text: 'A function that accepts no parameters' },
      { label: 'B', text: 'A function bundled together with its lexical environment' },
      { label: 'C', text: 'A self-invoking function expression' },
      { label: 'D', text: 'A method stored inside an object' },
    ],
    correctAnswer: 'B',
    solutionExplanation:
      'A closure is a function that retains access to variables from its outer scope even after the outer function has returned.',
    tags: ['closure', 'scope', 'functions'],
  },
  {
    type: 'mcq', topic: 'JavaScript', difficulty: 'Hard',
    title: 'Describe the JavaScript Event Loop',
    description: 'What is the correct execution order for async code in Node.js / the browser?',
    options: [
      { label: 'A', text: 'Call Stack → Callback Queue → Web APIs → Event Loop' },
      { label: 'B', text: 'Web APIs → Call Stack → Callback Queue → Event Loop' },
      { label: 'C', text: 'Call Stack → Web APIs → Callback Queue → Event Loop' },
      { label: 'D', text: 'Event Loop → Call Stack → Web APIs → Callback Queue' },
    ],
    correctAnswer: 'C',
    solutionExplanation:
      'Sync code runs in the Call Stack. Async ops delegate to Web APIs. When done, callbacks enter the Callback Queue. The Event Loop pushes them back to the Call Stack when it is empty.',
    tags: ['event-loop', 'async', 'concurrency'],
  },
  // ── React ──────────────────────────────────────────────────────────────────
  {
    type: 'mcq', topic: 'React', difficulty: 'Easy',
    title: 'What is JSX?',
    description: 'Which statement best describes JSX in React?',
    options: [
      { label: 'A', text: 'A JavaScript XML parser' },
      { label: 'B', text: 'A syntax extension that resembles HTML and compiles to React.createElement calls' },
      { label: 'C', text: 'A new programming language' },
      { label: 'D', text: 'A CSS-in-JS solution' },
    ],
    correctAnswer: 'B',
    solutionExplanation: 'JSX is syntactic sugar over React.createElement(). Babel transforms it during build.',
    tags: ['jsx', 'react-basics'],
  },
  {
    type: 'mcq', topic: 'React', difficulty: 'Medium',
    title: 'useEffect with an empty dependency array',
    description: 'When does useEffect(() => { ... }, []) execute?',
    options: [
      { label: 'A', text: 'After every render' },
      { label: 'B', text: 'Only when state changes' },
      { label: 'C', text: 'Once, after the initial render' },
      { label: 'D', text: 'Never' },
    ],
    correctAnswer: 'C',
    solutionExplanation:
      'An empty dependency array means the effect runs only once, equivalent to componentDidMount in class components.',
    tags: ['hooks', 'useEffect', 'lifecycle'],
  },
  // ── Node.js ────────────────────────────────────────────────────────────────
  {
    type: 'mcq', topic: 'Node.js', difficulty: 'Easy',
    title: 'Which JS engine powers Node.js?',
    description: 'Node.js is built on which JavaScript engine?',
    options: [
      { label: 'A', text: 'SpiderMonkey' },
      { label: 'B', text: 'JavaScriptCore' },
      { label: 'C', text: 'V8' },
      { label: 'D', text: 'Chakra' },
    ],
    correctAnswer: 'C',
    solutionExplanation: "Node.js uses Google's V8 engine which compiles JS to native machine code.",
    tags: ['node-basics', 'V8', 'runtime'],
  },
  {
    type: 'mcq', topic: 'Node.js', difficulty: 'Medium',
    title: 'What is Express middleware?',
    description: 'Which best describes middleware in Express.js?',
    options: [
      { label: 'A', text: 'A database abstraction layer' },
      { label: 'B', text: 'Functions that execute during the request-response cycle with access to req, res, next' },
      { label: 'C', text: 'A server-side rendering engine' },
      { label: 'D', text: 'An in-memory caching system' },
    ],
    correctAnswer: 'B',
    solutionExplanation: 'Middleware can read/modify req and res, terminate the cycle, or pass control via next().',
    tags: ['express', 'middleware'],
  },
  // ── DSA ────────────────────────────────────────────────────────────────────
  {
    type: 'mcq', topic: 'DSA', difficulty: 'Easy',
    title: 'Time complexity of binary search',
    description: 'What is the worst-case time complexity of binary search on a sorted array of n elements?',
    options: [
      { label: 'A', text: 'O(n)' },
      { label: 'B', text: 'O(n²)' },
      { label: 'C', text: 'O(log n)' },
      { label: 'D', text: 'O(1)' },
    ],
    correctAnswer: 'C',
    solutionExplanation: 'Binary search halves the search space each step → O(log n).',
    tags: ['binary-search', 'time-complexity'],
  },
  {
    type: 'mcq', topic: 'DSA', difficulty: 'Medium',
    title: 'Stack vs Queue',
    description: 'Which data structure follows the LIFO principle?',
    options: [
      { label: 'A', text: 'Queue' },
      { label: 'B', text: 'Stack' },
      { label: 'C', text: 'Linked List' },
      { label: 'D', text: 'Binary Tree' },
    ],
    correctAnswer: 'B',
    solutionExplanation: 'A Stack is LIFO — the last element pushed is the first popped. Queues use FIFO.',
    tags: ['stack', 'queue', 'data-structures'],
  },
  // ── Coding ─────────────────────────────────────────────────────────────────
  {
    type: 'coding', topic: 'DSA', difficulty: 'Easy',
    title: 'Two Sum',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target. Each input has exactly one solution, and you may not use the same element twice.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 9' },
      { input: 'nums = [3,2,4], target = 6',     output: '[1,2]', explanation: 'nums[1] + nums[2] = 6' },
    ],
    constraints: ['2 <= nums.length <= 10⁴', '-10⁹ <= nums[i] <= 10⁹', 'Exactly one valid answer'],
    starterCode: {
      javascript: 'function twoSum(nums, target) {\n  // your solution\n}',
      python:     'def two_sum(nums: list[int], target: int) -> list[int]:\n    pass',
      java:       'public int[] twoSum(int[] nums, int target) {\n    // your solution\n}',
    },
    solution: {
      javascript:
        'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n}',
      python:
        'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i',
    },
    solutionExplanation:
      'Use a HashMap to store each number and its index. For each element, check whether its complement (target − num) already exists in the map.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    hints: ['Can you do it in a single pass?', 'A hash map gives O(1) look-ups.'],
    tags: ['array', 'hash-map'],
  },
  {
    type: 'coding', topic: 'JavaScript', difficulty: 'Medium',
    title: 'Deep Flatten Array',
    description:
      'Write a function that recursively flattens a deeply nested array. Do NOT use Array.prototype.flat().',
    examples: [
      { input: '[1, [2, [3, [4]], 5]]', output: '[1, 2, 3, 4, 5]', explanation: 'All nesting removed' },
    ],
    constraints: ['Values may be numbers, strings, or booleans', 'Unlimited nesting depth'],
    starterCode: {
      javascript: 'function flatten(arr) {\n  // your solution\n}',
      python:     'def flatten(arr):\n    pass',
    },
    solution: {
      javascript:
        'function flatten(arr) {\n  return arr.reduce((flat, item) =>\n    flat.concat(Array.isArray(item) ? flatten(item) : item)\n  , []);\n}',
    },
    solutionExplanation:
      'Use Array.reduce + recursion: for each element, if it is an array call flatten() on it, otherwise push it directly.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    hints: ['Think recursively.', 'Array.reduce can accumulate the result.'],
    tags: ['recursion', 'arrays', 'reduce'],
  },
  {
    type: 'coding', topic: 'DSA', difficulty: 'Hard',
    title: 'Longest Palindromic Substring',
    description: 'Given a string s, return the longest palindromic substring.',
    examples: [
      { input: 's = "babad"', output: '"bab"',  explanation: '"aba" is also valid' },
      { input: 's = "cbbd"',  output: '"bb"',   explanation: 'Longest palindrome is "bb"' },
    ],
    constraints: ['1 <= s.length <= 1000', 's consists of digits and English letters'],
    starterCode: {
      javascript: 'function longestPalindrome(s) {\n  // your solution\n}',
      python:     'def longest_palindrome(s: str) -> str:\n    pass',
    },
    solution: {
      javascript:
        'function longestPalindrome(s) {\n  let start = 0, maxLen = 1;\n  const expand = (l, r) => {\n    while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }\n    if (r - l - 1 > maxLen) { maxLen = r - l - 1; start = l + 1; }\n  };\n  for (let i = 0; i < s.length; i++) {\n    expand(i, i);     // odd\n    expand(i, i + 1); // even\n  }\n  return s.substring(start, start + maxLen);\n}',
    },
    solutionExplanation:
      'Expand Around Center: for every character (and every pair), expand outward while characters match. Track the longest window found.',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    hints: ['Try expanding from each center.', 'Handle both odd- and even-length palindromes.'],
    tags: ['dynamic-programming', 'string', 'two-pointers'],
  },
];

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  await Question.deleteMany({});
  const inserted = await Question.insertMany(questions);
  console.log(`✅ Seeded ${inserted.length} questions`);

  const adminEmail = 'admin@interviewprep.com';
  if (!(await User.findOne({ email: adminEmail }))) {
    await User.create({ name: 'Admin', email: adminEmail, password: 'admin123', role: 'admin' });
    console.log('✅ Admin created  →  admin@interviewprep.com / admin123');
  }

  console.log('🎉 Seed complete');
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});