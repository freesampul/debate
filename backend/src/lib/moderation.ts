const PROFANITY_PATTERNS = [
  /\bfuck(?:er|ing|ed|s)?\b/gi,
  /\bshit(?:ty|head|ting|s)?\b/gi,
  /\bbitch(?:es)?\b/gi,
  /\basshole\b/gi,
  /\bdamn\b/gi,
]

function redactMatch(match: string): string {
  return '*'.repeat(Math.max(match.length, 3))
}

export function moderateMessageContent(content: string): {
  filteredContent: string
  moderationStatus: 'visible' | 'filtered'
} {
  let filteredContent = content.trim()
  let wasFiltered = false

  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(filteredContent)) {
      wasFiltered = true
      filteredContent = filteredContent.replace(pattern, redactMatch)
    }
  }

  return {
    filteredContent,
    moderationStatus: wasFiltered ? 'filtered' : 'visible',
  }
}
