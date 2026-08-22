const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

function firstGrapheme(value: string): string {
  for (const { segment } of segmenter.segment(value)) return segment;
  return "";
}

export function initials(name: string, email: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    const first = words[0] ?? "";
    const last = words[words.length - 1] ?? "";
    return (firstGrapheme(first) + firstGrapheme(last)).toUpperCase();
  }

  if (words.length === 1) {
    return firstGrapheme(words[0] ?? "").toUpperCase();
  }

  const local = email.trim().split("@")[0] ?? "";
  return firstGrapheme(local).toUpperCase();
}
