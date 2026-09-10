import { hotkeys } from "../app-hotkeys.ts";
import type { Hotkey } from "../ui/hotkeys/hotkey.ts";
import { HotkeyDisplay } from "../ui/hotkeys/HotkeyDisplay.tsx";
import { joinNodes } from "../ui/nodes.ts";
import styles from "./HelpScreen.module.css";

export function HelpScreen() {
  return (
    <div className={styles.root}>
      <h3>Problem List Screen</h3>
      <HotkeyList
        hotkeys={[
          hotkeys.problemList.randomProblem,
          hotkeys.problemList.shuffleProblems,
          hotkeys.problemList.unshuffleProblems,
          hotkeys.problemList.resetFilters,
        ]}
      />
      <h3>Problem Screen</h3>
      <HotkeyList
        hotkeys={[
          hotkeys.problem.showAnswer,
          hotkeys.problem.rateFail[0],
          hotkeys.problem.rateFail[1],
          hotkeys.problem.rateVeryHard[0],
          hotkeys.problem.rateVeryHard[1],
          hotkeys.problem.rateHard[0],
          hotkeys.problem.rateHard[1],
          hotkeys.problem.rateGood[0],
          hotkeys.problem.rateGood[1],
          hotkeys.problem.rateEasy[0],
          hotkeys.problem.rateEasy[1],
          hotkeys.problem.toggleWork,
          hotkeys.problem.back[0],
          hotkeys.problem.back[1],
        ]}
      />
      <h3>Anywhere</h3>
      <HotkeyList hotkeys={[hotkeys.showHelp]} />
    </div>
  );
}

function HotkeyList({ hotkeys }: { hotkeys: Hotkey[] }) {
  const groups = new Map<string, Hotkey[]>();
  for (const hotkey of hotkeys) {
    const { description } = hotkey;
    if (description) {
      let group = groups.get(description);
      if (!group) {
        groups.set(description, (group = []));
      }
      group.push(hotkey);
    }
  }
  return (
    <div className={styles.list}>
      {[...groups.entries()].map(([description, hotkeys], index) => (
        <HotkeyItem key={index} description={description} hotkeys={hotkeys} />
      ))}
    </div>
  );
}

function HotkeyItem({ description, hotkeys }: { description: string; hotkeys: Hotkey[] }) {
  const nodes = hotkeys.map((hotkey, index) => <HotkeyDisplay key={index} hotkey={hotkey} />);
  return (
    <>
      <span className={styles.description}>{description}</span>
      <span className={styles.hotkey}>{joinNodes(nodes).with(<span> / </span>)}</span>
    </>
  );
}
