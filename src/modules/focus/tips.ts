// James Clear / Atomic Habits inspired focus tips
// Rotate through these during focus sessions to reinforce good habits
// Short, actionable, one sentence each.

export const focusTips: string[] = [
  "You do not rise to the level of your goals. You fall to the level of your systems.",
  "Every action is a vote for the person you want to become.",
  "The task that matters most is usually the one you're avoiding.",
  "Make the good habit the path of least resistance.",
  "Reduce friction for good behaviors. Increase friction for bad ones.",
  "The 2-minute rule: if it takes less than 2 minutes, do it now.",
  "Focus on the process, not the outcome. The score takes care of itself.",
  "Professionals stick to the schedule. Amateurs let life get in the way.",
  "Environment is the invisible hand that shapes behavior.",
  "You don't need motivation. You need a ritual.",
  "Be the designer of your world, not merely the consumer of it.",
  "Standardize before you optimize.",
  "The most effective form of learning is practice, not planning.",
  "Decisive action now is better than perfect action later.",
  "Time spent thinking without acting is the thief of execution.",
  "What gets measured gets managed. Track your deep work hours.",
  "One focused hour beats three distracted ones.",
  "Clarity about what matters provides clarity about what does not.",
  "Your only job right now is the task in front of you.",
  "Small daily improvements are the key to staggering long-term results.",
];

// Get a random tip
export function getRandomTip(): string {
  return focusTips[Math.floor(Math.random() * focusTips.length)];
}

// Get tip by index (for deterministic display)
export function getTipByIndex(index: number): string {
  return focusTips[index % focusTips.length];
}
