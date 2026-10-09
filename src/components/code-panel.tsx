import { Panel } from "@/components/ui";

type CodePanelProps = {
  lines: readonly string[];
  /** Zero-based index of the line being executed. */
  activeLine?: number | null;
  /** Part of the active line to emphasise, such as `i < ukuran_array`. */
  activePart?: string | null;
};

export function CodePanel({
  lines,
  activeLine = null,
  activePart = null,
}: CodePanelProps) {
  return (
    <Panel title="Kode C">
      <pre className="overflow-x-auto rounded-xl bg-surface-muted py-3 font-mono text-sm leading-8 xl:text-base">
        <code>
          {lines.map((line, index) => {
            const isActive = index === activeLine;
            return (
              <span
                key={index}
                aria-current={isActive ? "step" : undefined}
                className={`block border-l-4 pr-4 pl-2 ${isActive ? "border-active bg-active/10" : "border-transparent"}`}
              >
                <span
                  aria-hidden="true"
                  className="mr-3 inline-block w-5 text-right text-muted-foreground select-none"
                >
                  {index + 1}
                </span>
                {isActive && activePart ? emphasise(line, activePart) : line}
                {isActive ? (
                  <span className="sr-only"> (baris yang sedang jalan)</span>
                ) : null}
              </span>
            );
          })}
        </code>
      </pre>
    </Panel>
  );
}

function emphasise(line: string, part: string) {
  const start = line.indexOf(part);
  if (start === -1) {
    return line;
  }
  return (
    <>
      {line.slice(0, start)}
      <mark className="rounded-sm bg-active/15 px-0.5 text-foreground ring-1 ring-active/50">
        {part}
      </mark>
      {line.slice(start + part.length)}
    </>
  );
}
