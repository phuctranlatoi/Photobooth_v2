/** Serialize mutations without allowing a failed command to suppress later commands. */
export function enqueueCommand(queue: {current: Promise<void>}, run: () => Promise<boolean>): Promise<boolean> {
  const next = queue.current.then(run);
  queue.current = next.then(() => {}, () => {});
  return next;
}
