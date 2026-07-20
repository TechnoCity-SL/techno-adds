/**
 * JSON.stringify does not escape "<", so user-controlled content (an ad title
 * containing literally "</script>") could break out of the surrounding
 * <script type="application/ld+json"> tag and inject arbitrary markup —
 * a well-known JSON-LD injection vector. `<` is valid inside a JSON
 * string and decodes back to "<" for any real JSON-LD parser/crawler, so this
 * neutralizes the injection without corrupting the structured data itself.
 * This is what CLAUDE.md rule #11 ("no user content as raw HTML") means here.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
