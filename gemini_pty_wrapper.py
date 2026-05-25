#!/usr/bin/env python3
"""
Gemini CLI PTY wrapper — запускает gemini в интерактивном TUI через псевдо-терминал.
Позволяет headless-агенту использовать write_file, replace, shell (полный набор инструментов).
"""

import pexpect
import sys
import time
import os

# Environment
GEMINI_BIN = "/home/pronkost/.nvm/versions/node/v22.22.3/bin/gemini"
WORK_DIR = "/home/pronkost/projects/street-fighter-card"
MODEL = "gemini-3.1-pro-preview"

def run_gemini_task(prompt: str, timeout: int = 300) -> str:
    """Run gemini in PTY TUI mode, send prompt, capture output."""
    
    env = os.environ.copy()
    env["PATH"] = "/home/pronkost/.nvm/versions/node/v22.22.3/bin:" + env.get("PATH", "")
    env["GEMINI_CLI_TRUST_WORKSPACE"] = "true"
    
    # Spawn gemini in TUI mode (no --prompt flag!)
    cmd = [GEMINI_BIN, "--model", MODEL]
    
    print(f"[WRAPPER] Spawning Gemini TUI in {WORK_DIR}...")
    child = pexpect.spawn(cmd[0], cmd[1:], cwd=WORK_DIR, env=env, 
                          encoding="utf-8", timeout=timeout)
    
    # Wait for TUI to initialize
    print("[WRAPPER] Waiting for TUI initialization...")
    time.sleep(3)
    
    # Read initial output
    try:
        child.read_nonblocking(size=2000, timeout=1)
    except:
        pass
    
    # Send the prompt
    print(f"[WRAPPER] Sending prompt...")
    child.sendline(prompt)
    
    # Wait for processing
    print("[WRAPPER] Waiting for response...")
    time.sleep(2)
    
    # Collect output for the full duration
    output = ""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            chunk = child.read_nonblocking(size=4096, timeout=5)
            output += chunk
            # Detect completion signals
            if "I've completed" in output or "done" in output[-500:].lower():
                break
        except pexpect.TIMEOUT:
            continue
        except pexpect.EOF:
            break
    
    # Send quit command
    print("[WRAPPER] Quitting...")
    child.sendline("/quit")
    time.sleep(1)
    child.terminate(force=True)
    
    return output

if __name__ == "__main__":
    prompt = sys.argv[1] if len(sys.argv) > 1 else "Hello"
    result = run_gemini_task(prompt)
    print("\n" + "="*60)
    print("OUTPUT:")
    print(result[-3000:])  # Last 3000 chars
    print("="*60)
