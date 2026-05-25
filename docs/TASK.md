# TASK: v3.1 Hotfix + Avatars

## Bug: Cards run out in Career mode
**Problem:** After winning Career battles, player's deck empties and only 1 card gets added as reward. By battle 3-4, player has ~5 cards left in deck + discard = impossible to play.

**Root cause (from code inspection):**
- `prepareNextBattle()` does NOT shuffle discard back into deck between battles
- Reward adds only 1 new card, but deck was already depleted from previous fight
- `drawCards()` tries to draw from empty deck, gets nothing

**Fix needed:**
1. In `prepareNextBattle()`: `pDeck.push(...pDiscard); pDiscard = [];` then shuffle
2. Same for enemy deck `eDeck` / `eDiscard`
3. After reward selection, ensure deck is shuffled and full
4. Visual: show "Колода восстановлена!" message

## Feature: Real character avatars
**Current:** 8×8 SVG pixel avatars (cute but not recognizable)
**Target:** AI-generated base64 PNG avatars, retro fighting game style

**Characters:**
1. Ryu — white headband, gi, serious, hadoken pose
2. Ken — blonde, red gi, confident
3. Chun-Li — blue qipao, twin buns, lightning kick pose
4. Guile — flat top, green camo, arms crossed
5. Zangief — red shorts, mohawk, flexing
6. Dhalsim — orange, skinny, yoga fire pose
7. Blanka — green, orange hair, beastly
8. E.Honda — blue mawashi, sumo stance

**Implementation:**
- Use AI image generation (image_generate tool or placeholder URLs)
- Convert to base64, embed as `<img>` in HTML
- Style: 120×120px, border, retro pixel-art filter or Street Fighter Alpha style
- Keep SVG fallback if generation fails

**Requirements:**
- Single HTML file (base64 inline)
- Russian UI preserved
- All existing features preserved
