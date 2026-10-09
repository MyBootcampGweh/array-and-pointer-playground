import { type Ref } from "react";

import { addressOf } from "@/lib/memory";

const BOX =
  "flex items-center justify-center rounded-xl border-2 px-2 font-mono text-xl font-semibold tabular-nums transition-colors duration-200 ease-interaction sm:text-2xl";

const CELL_SIZE = "min-h-14 min-w-14 sm:min-h-16 sm:min-w-16";

const ROW_HEADER = "pr-1 text-left text-xs font-medium sm:text-sm";

function cellTone(isActive: boolean): string {
  return isActive
    ? "border-active bg-active/10 shadow-elevated"
    : "border-border bg-card";
}

function Unassigned() {
  return (
    <span className="text-muted-foreground">
      ?<span className="sr-only"> (belum diisi)</span>
    </span>
  );
}

type ArrayViewProps = {
  name: string;
  /** `null` marks an element that has not been assigned yet. */
  values: readonly (number | null)[];
  activeIndex?: number | null;
  /** Shown under the active element, so the highlight never relies on colour. */
  activeLabel?: string;
  /** Turns each element into a button that selects it. */
  onSelect?: (index: number) => void;
  showAddresses?: boolean;
  /** Attached to the active element, for a pointer arrow to land on. */
  activeRef?: Ref<HTMLSpanElement>;
};

export function ArrayView({
  name,
  values,
  activeIndex = null,
  activeLabel,
  onSelect,
  showAddresses = false,
  activeRef,
}: ArrayViewProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <table className="border-separate border-spacing-x-2 border-spacing-y-1">
        <caption className="sr-only">
          Array {name}: indeks, nilai{showAddresses ? ", dan alamat" : ""} tiap
          elemen
        </caption>
        <tbody>
          <tr>
            <th scope="row" className={`${ROW_HEADER} text-index`}>
              indeks
            </th>
            {values.map((_, index) => (
              <td
                key={index}
                className="text-center font-mono text-sm text-index"
              >
                [{index}]
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" className={`${ROW_HEADER} text-value`}>
              nilai
            </th>
            {values.map((value, index) => {
              const isActive = index === activeIndex;
              const box = (
                <span
                  ref={isActive ? activeRef : undefined}
                  className={`${BOX} ${CELL_SIZE} ${cellTone(isActive)} text-value`}
                >
                  {value ?? <Unassigned />}
                </span>
              );
              return (
                <td key={index}>
                  {onSelect ? (
                    <button
                      type="button"
                      aria-pressed={isActive}
                      aria-label={`${name}[${index}], nilainya ${value ?? "belum diisi"}`}
                      onClick={() => onSelect(index)}
                      className="block rounded-xl"
                    >
                      {box}
                    </button>
                  ) : (
                    box
                  )}
                </td>
              );
            })}
          </tr>
          {showAddresses ? (
            <tr>
              <th scope="row" className={`${ROW_HEADER} text-address`}>
                alamat
              </th>
              {values.map((_, index) => (
                <td
                  key={index}
                  className="text-center font-mono text-xs text-address sm:text-sm"
                >
                  {addressOf(index)}
                </td>
              ))}
            </tr>
          ) : null}
          {activeLabel !== undefined ? (
            <tr>
              <th scope="row">
                <span className="sr-only">penanda</span>
              </th>
              {values.map((_, index) => (
                <td
                  key={index}
                  className="h-6 text-center text-xs font-semibold whitespace-nowrap text-active sm:text-sm"
                >
                  {index === activeIndex ? activeLabel : null}
                </td>
              ))}
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

type VariableBoxProps = {
  type: "int" | "int *";
  name: string;
  /** `null` while the variable has no assigned value yet. */
  value: number | null;
  /** Illustrative address, shown under the box. */
  address?: number;
  isActive?: boolean;
  ref?: Ref<HTMLDivElement>;
};

export function VariableBox({
  type,
  name,
  value,
  address,
  isActive = false,
  ref,
}: VariableBoxProps) {
  const isPointer = type === "int *";
  const tone = isActive
    ? cellTone(true)
    : isPointer
      ? "border-pointer/60 bg-card"
      : cellTone(false);
  return (
    <figure className="flex flex-col items-center gap-1.5">
      <figcaption className="font-mono text-sm">
        <span className="text-muted-foreground">{type} </span>
        <span
          className={`font-semibold ${isPointer ? "text-pointer" : "text-foreground"}`}
        >
          {name}
        </span>
      </figcaption>
      <div
        ref={ref}
        className={`${BOX} min-h-16 min-w-24 ${tone} ${isPointer ? "text-address" : "text-value"}`}
      >
        {value ?? <Unassigned />}
      </div>
      <span className="text-xs text-muted-foreground">
        {isPointer ? "isinya: alamat" : "isinya: nilai"}
      </span>
      {address !== undefined ? (
        <span className="font-mono text-xs text-address sm:text-sm">
          alamat {address}
        </span>
      ) : null}
    </figure>
  );
}
