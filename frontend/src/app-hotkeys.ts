import { hotkey } from "./ui/hotkeys/hotkey.ts";

export const hotkeys = {
  showHelp: hotkey("Ctrl+Shift+?", "Show keyboard shortcuts."),
  problemList: {
    randomProblem: hotkey("r", "Open a random new problem."),
    shuffleProblems: hotkey("s", "Shuffle new problems."),
    unshuffleProblems: hotkey("Shift+s", "Restore the original order of new problems."),
    resetFilters: hotkey("x", "Reset filters."),
  } as const,
  problem: {
    back: [hotkey("b", "Return to the problem list."), hotkey("Backspace", "Return to the problem list.")],
    toggleWork: hotkey("w", "Start or stop working on this problem."),
    showAnswer: hotkey("Space", "Show the answer."),
    rateFail: [hotkey("f", "Grade problem as Fail."), hotkey("1", "Grade problem as Fail.")],
    rateVeryHard: [hotkey("v", "Grade problem as Very hard."), hotkey("2", "Grade problem as Very hard.")],
    rateHard: [hotkey("h", "Grade problem as Hard."), hotkey("3", "Grade problem as Hard.")],
    rateGood: [hotkey("g", "Grade problem as Good."), hotkey("4", "Grade problem as Good.")],
    rateEasy: [hotkey("e", "Grade problem as Easy."), hotkey("5", "Grade problem as Easy.")],
  } as const,
} as const;
