#!/usr/bin/env python3
"""
Run Opus 4.7 analysis on Street Fighter Card Game via Tokenator Anthropic endpoint.
Usage: python3 run_opus_analysis.py
Output: writes to docs/improvements_opus47_FINAL.md
Requires: TOKENATOR_API_KEY in ~/.claude_env.sh or as env var
"""
import json, os, sys, re

# --- CONFIG ---
TOKENATOR_KEY = os.getenv("TOKENATOR_API_KEY", "").strip()
if not TOKENATOR_KEY:
    # Try to load from .claude_env.sh
    env_path = os.path.expanduser("~/.claude_env.sh")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("export TOKENATOR_API_KEY="):
                    TOKENATOR_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break

if not TOKENATOR_KEY:
    print("ERROR: TOKENATOR_API_KEY not found. Export it or put in ~/.claude_env.sh")
    sys.exit(1)

BASE_URL = "https://api.tokenator.top/anthropic/v1/messages"
MODEL = "claude-opus-4-7"
PROJECT_DIR = "/home/pronkost/projects/street-fighter-card"
PROMPT_FILE = f"{PROJECT_DIR}/docs/prompt_for_opus.txt"
GAME_JS = f"{PROJECT_DIR}/game.js"
OUTPUT_FILE = f"{PROJECT_DIR}/docs/improvements_opus47_FINAL.md"

# --- READ FILES ---
with open(PROMPT_FILE, "r", encoding="utf-8") as f:
    prompt_text = f.read()

with open(GAME_JS, "r", encoding="utf-8") as f:
    game_js = f.read()

# --- BUILD MESSAGES ---
system_msg = (
    "You are a senior game developer and software architect. Analyze the provided JavaScript code "
    "for a browser-based Street Fighter card battler game. Write your analysis in RUSSIAN language. "
    "Be specific, cite exact line numbers, provide code fixes with before/after, and structure output as markdown."
    "\n\nAfter completing the full analysis, you must write the result to the file specified in the prompt."
)

user_msg = f"""{prompt_text}

---

## FULL SOURCE CODE (game.js)

```javascript
{game_js}
```

---

Now perform the complete analysis and write it to: `{OUTPUT_FILE}`
"""

messages = [
    {"role": "user", "content": user_msg}
]

payload = {
    "model": MODEL,
    "max_tokens": 8000,
    "temperature": 0.3,
    "system": system_msg,
    "messages": messages
}

# --- SEND REQUEST ---
import urllib.request

req = urllib.request.Request(
    BASE_URL,
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Content-Type": "application/json",
        "x-api-key": TOKENATOR_KEY,
        "anthropic-version": "2023-06-01"
    },
    method="POST"
)

print(f"Sending request to {BASE_URL}...")
print(f"Model: {MODEL}")
print(f"Input tokens estimate: ~{len(system_msg) + len(user_msg)} chars (~{len(system_msg + user_msg) // 4} tokens)")
print()

try:
    with urllib.request.urlopen(req, timeout=300) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    # Extract usage
    usage = data.get("usage", {})
    print(f"Response received!")
    print(f"Input tokens: {usage.get('input_tokens', '?')}")
    print(f"Output tokens: {usage.get('output_tokens', '?')}")
    print()

    # Extract content
    content_blocks = data.get("content", [])
    text = ""
    for block in content_blocks:
        if block.get("type") == "text":
            text += block.get("text", "")
        elif block.get("type") == "tool_use":
            # Handle tool use if model tries to call a tool
            print(f"Tool use detected: {block.get('name')}")
            text += f"\n[Tool use: {block.get('name')} with input: {block.get('input', {})}]\n"

    # Write output
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(text)

    size = os.path.getsize(OUTPUT_FILE)
    print(f"[OK] File written: {OUTPUT_FILE}")
    print(f"Size: {size} bytes ({size // 1024} KB)")

    # Also print first 2000 chars for preview
    print("\n--- PREVIEW (first 2000 chars) ---")
    print(text[:2000])
    print("\n--- END PREVIEW ---")

except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.reason}")
    body = e.read().decode("utf-8")
    print(body)
    sys.exit(1)
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    sys.exit(1)
