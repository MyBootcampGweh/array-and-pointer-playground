export type ParseResult<T> =
  { ok: true; value: T } | { ok: false; error: string };

export const INT_MIN = -2147483648;
export const INT_MAX = 2147483647;

/** Longest name that still fits the memory boxes on a phone screen. */
export const MAX_IDENTIFIER_LENGTH = 16;

const C_KEYWORDS = new Set([
  "auto",
  "break",
  "case",
  "char",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extern",
  "float",
  "for",
  "goto",
  "if",
  "inline",
  "int",
  "long",
  "register",
  "restrict",
  "return",
  "short",
  "signed",
  "sizeof",
  "static",
  "struct",
  "switch",
  "typedef",
  "union",
  "unsigned",
  "void",
  "volatile",
  "while",
  "_Alignas",
  "_Alignof",
  "_Atomic",
  "_Bool",
  "_Complex",
  "_Generic",
  "_Imaginary",
  "_Noreturn",
  "_Static_assert",
  "_Thread_local",
  // C23
  "alignas",
  "alignof",
  "bool",
  "constexpr",
  "false",
  "nullptr",
  "static_assert",
  "thread_local",
  "true",
  "typeof",
  "typeof_unqual",
]);

export function parseIntInput(raw: string): ParseResult<number> {
  const text = raw.trim();
  if (text === "") {
    return { ok: false, error: "Belum diisi. Ketik sebuah bilangan bulat." };
  }
  if (!/^[+-]?\d+$/.test(text)) {
    return {
      ok: false,
      error: "Harus bilangan bulat, tanpa koma atau huruf. Contoh: 42.",
    };
  }
  const value = Number(text);
  if (value < INT_MIN || value > INT_MAX) {
    return {
      ok: false,
      error: `Di luar jangkauan int (${INT_MIN} sampai ${INT_MAX}).`,
    };
  }
  // `Object.is` guard: "-0" parses to -0, which would print as "0" anyway.
  return { ok: true, value: Object.is(value, -0) ? 0 : value };
}

/**
 * Checks a variable name against C's identifier rules.
 *
 * `taken` holds names the snippet already uses (`printf`, the loop counter, the
 * other variables), so the code on screen always stays valid C.
 */
export function validateIdentifier(
  raw: string,
  taken: readonly string[],
): ParseResult<string> {
  const name = raw.trim();
  if (name === "") {
    return { ok: false, error: "Nama tidak boleh kosong." };
  }
  if (name.length > MAX_IDENTIFIER_LENGTH) {
    return {
      ok: false,
      error: `Maksimal ${MAX_IDENTIFIER_LENGTH} karakter supaya muat di layar.`,
    };
  }
  if (!/^[A-Za-z_]/.test(name)) {
    return { ok: false, error: "Harus diawali huruf atau garis bawah (_)." };
  }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    return {
      ok: false,
      error: "Hanya boleh huruf, angka, dan garis bawah (_), tanpa spasi.",
    };
  }
  if (C_KEYWORDS.has(name)) {
    return { ok: false, error: `"${name}" adalah kata kunci C.` };
  }
  if (/^_[A-Z_]/.test(name)) {
    return {
      ok: false,
      error:
        "Nama yang diawali _ lalu huruf besar atau _ dicadangkan compiler.",
    };
  }
  if (taken.includes(name)) {
    return { ok: false, error: `"${name}" sudah dipakai di kode ini.` };
  }
  return { ok: true, value: name };
}
