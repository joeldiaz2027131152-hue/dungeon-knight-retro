---
name: caged-treasure-gates
description: >
  Use when adding, fixing, or reviewing Unity 2D treasure chests locked behind
  cage bars, iron gates, levers, or barred treasure rooms. Helps keep the chest
  behind the bars while the player renders in front of the cage, and prevents
  sorting-order regressions in SpriteRenderer children.
---

# Caged Treasure Gates

Use this workflow when creating or fixing a chest inside a cage, barred room, or
lever-opened gate in the Unity port.

## Visual Order

Keep this order unless the local scene has a stronger established convention:

```text
0  back wall / shadow behind the treasure
1  chest body and every chest child accent
2  cage bars, rails, pillars, frame, highlights
3  player body
4+ effects, UI prompts, damage numbers, sparks
```

The important rule: the chest must be behind the bars, and the player must be in
front of both the bars and the chest.

## Implementation Checklist

1. Create the cage back wall first with a lower `sortingOrder` than the chest.
2. Create the chest and set the sorting on the main `SpriteRenderer`.
3. Set sorting on child renderers too, especially lid accents or glow pieces.
4. Create bars, rails, pillars, and highlights above the chest but below the player.
5. Keep the gate collider as trigger/interactable if the player should be able to
   stand inside or pass through after opening.
6. Re-check the prompt position so text never hides the player or chest.

## Unity Pattern

Use named constants near the cage builder so future edits do not scatter magic
numbers:

```csharp
const int cageBackOrder = 0;
const int cageChestOrder = 1;
const int cageFrameOrder = 2;
const int cageBarOrder = 2;
```

If the chest component has child renderers, expose a small method like:

```csharp
public void SetVisualSorting(int bodyOrder, int lidOrder)
{
    if (TryGetComponent(out SpriteRenderer bodyRenderer))
    {
        bodyRenderer.sortingOrder = bodyOrder;
    }

    if (lidAccent && lidAccent.TryGetComponent(out SpriteRenderer lidRenderer))
    {
        lidRenderer.sortingOrder = lidOrder;
    }
}
```

Then call it only for the caged chest:

```csharp
TreasureChest cagedChest = CreateChest(position, coins);
cagedChest.SetVisualSorting(cageChestOrder, cageChestOrder);
```

## Verification

Before calling the task done:

- Stand the player directly in front of the cage.
- Confirm the player is visible over the bars.
- Confirm the chest body and lid are both behind the bars.
- Open the chest and confirm the opened animation does not move any child renderer
  above the bars unless that effect is intentionally magical or UI-only.
- Run `git diff --check`.
