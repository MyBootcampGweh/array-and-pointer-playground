"use client";

import {
  DraftInput,
  EditorCard,
  EditorNotice,
  FieldRow,
  LengthSelect,
  NameInput,
  ValuesRow,
} from "@/components/program-editor";
import {
  type ArrayIndexingProgram,
  type ProgramEdit,
  TAKEN_NAMES,
  parseIndex,
} from "@/lib/array-indexing";

export function ArrayEditor({
  program,
  notice,
  onEdit,
}: {
  program: ArrayIndexingProgram;
  /** A short note on what the last edit adjusted, such as a moved Index. */
  notice: string | null;
  onEdit: (edit: ProgramEdit) => void;
}) {
  const { arrayName, values, index } = program;

  return (
    <EditorCard
      title="Atur Array"
      onRestore={() => onEdit({ kind: "restore" })}
    >
      <FieldRow>
        <NameInput
          label="Nama array"
          value={arrayName}
          taken={TAKEN_NAMES}
          onCommit={(name) => onEdit({ kind: "rename", name })}
        />
        <LengthSelect
          value={values.length}
          onChange={(length) => onEdit({ kind: "resize", length })}
        />
        <DraftInput
          label="Index yang diakses"
          value={index}
          format={String}
          parse={(raw) => parseIndex(raw, values.length)}
          onCommit={(next) => onEdit({ kind: "select", index: next })}
          inputMode="numeric"
          className="w-32"
          inputClassName="text-index-ink"
        />
      </FieldRow>
      <EditorNotice notice={notice} />
      <ValuesRow
        arrayName={arrayName}
        values={values}
        onCommit={(position, value) =>
          onEdit({ kind: "value", index: position, value })
        }
      />
    </EditorCard>
  );
}
