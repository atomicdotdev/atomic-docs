---
sidebar_position: 1
title: "The Lego Story: How Atomic Thinks Differently"
description: "Understanding Atomic's semantic change graph through a simple Lego analogy"
keywords: [atomic, semantic change graph, DAG, semantic diff, lego analogy, merge conflicts]
---

# 🧱 The Lego Story

*How Atomic thinks about your code—and why it changes everything*

---

## The Photo Album Problem

Imagine you're building an elaborate Lego spaceship with your friends. You want to track every change so you can go back in time, share your work, and collaborate without stepping on each other's bricks.

**Traditional version control (like Git) works like a photo album.**

Every time someone makes a change, Git takes a photograph of the entire spaceship. Want to see what changed? Compare two photos pixel by pixel. Want to merge two people's work? Overlay the photos and hope the differences don't clash.

```text
📸 Photo 1        📸 Photo 2        📸 "What changed?"
┌─────────┐      ┌─────────┐      
│  🔴     │      │  🔴     │       "Hmm, comparing
│  🟢     │  →   │  🟡     │   →    millions of pixels...
│  🔵     │      │  🟢     │        something moved?"
└─────────┘      │  🔵     │      
                 └─────────┘      
```

This works, but it has problems:

- **Comparing photos is expensive** — especially for large projects
- **Photos don't understand structure** — they just see pixels (text lines)
- **Merging is guesswork** — when two photos differ, Git tries to blend them like Photoshop

---

## The Atomic Way: Smart Bricks

**Atomic doesn't take photos. Instead, each Lego brick knows its neighbors.**

When you snap a brick into place, it remembers:
- **What's above me?** (`up_context`)
- **What's below me?** (`down_context`)

```text
┌─────────────────────────────────────────────┐
│                                             │
│    🔴  "I'm connected to the base plate"    │
│     │                                       │
│     ▼                                       │
│    🟢  "🔴 is above me, 🔵 is below me"     │
│     │                                       │
│     ▼                                       │
│    🔵  "🟢 is above me"                     │
│                                             │
└─────────────────────────────────────────────┘
```

The structure **understands itself**. No photos needed.

---

## Adding a Brick: The Magic of Context

When you want to add a new yellow brick between the red and green ones, you don't update a photo. You simply declare:

> *"This yellow brick connects below 🔴 and above 🟢"*

```text
Before                      After
                           
  🔴                         🔴
   │                          │
   ▼                          ▼
  🟢          →              🟡 ← NEW! "I go between 🔴 and 🟢"
   │                          │
   ▼                          ▼
  🔵                         🟢
                              │
                              ▼
                             🔵
```

Atomic records this as a **change with context**:

```rust
NewVertex {
    up_context: [🔴],      // "I connect below the red brick"
    down_context: [🟢],    // "I connect above the green brick"  
    content: 🟡            // "I am the yellow brick"
}
```

The existing bricks don't need to change. The structure naturally relinks.

---

## Removing a Brick: Ghost Connections

What happens when you remove a brick? In Git, the photo just shows it's gone. In Atomic, something more elegant happens.

When you remove the green brick, Atomic doesn't just delete it. It creates a **"ghost edge"** — a memory that something *used to be there*.

```text
Before                      After
                           
  🔴                         🔴
   │                          │
   ▼                          │
  🟢          →              ···  (ghost: 🟢 was here)
   │                          │
   ▼                          ▼
  🔵                         🔵
```

Why does this matter?

1. **You can always undo** — the connection history is preserved
2. **Merges understand deletions** — if Alice deletes 🟢 while Bob modifies it, Atomic knows exactly what happened
3. **No orphaned changes** — everything maintains its context

---

## The Merge Magic: Structural Conflicts

Here's where Atomic truly shines.

**Scenario**: Alice and Bob both want to add a brick between 🔴 and 🟢.

### What Git Does (Photo Comparison)

Git compares photos and sees two different images. It tries to guess how to blend them:

```text
Alice's Photo     Bob's Photo       Git's Confusion
                                    
    🔴               🔴             "Two different photos...
     │                │              let me try to merge
     ▼                ▼              the pixels...
    🟡               🟣              
     │                │              CONFLICT! Which color
     ▼                ▼              goes where?!"
    🟢               🟢             
```

Git sees text that differs and tries to interleave lines. Sometimes it works. Sometimes you get a jumbled mess of conflict markers.

### What Atomic Does (Graph Structure)

Atomic doesn't compare photos. It looks at what each person *declared*:

```text
Alice's Change:                    Bob's Change:
                                   
NewVertex {                        NewVertex {
    up_context: [🔴],                  up_context: [🔴],
    down_context: [🟢],                down_context: [🟢],
    content: 🟡                        content: 🟣
}                                  }
```

Both changes say: *"I belong between 🔴 and 🟢."*

Atomic recognizes this as a **structural conflict** — not a text-munging problem:

```text
    🔴
     │
     ├──────┬──────┐
     │      │      │
     ▼      ▼      │
    🟡  ←→ 🟣      │  "Both claim the same spot.
     │      │      │   User decides the order."
     └──────┴──────┘
            │
            ▼
           🟢
```

The conflict is **explicit and structural**. You're not deciphering garbled text — you're deciding: *"Should Alice's brick or Bob's brick come first?"*

---

## Why Order Doesn't Matter: Commutativity

Here's the mathematical magic of Atomic.

**In Git**, the order you receive changes matters:
- Apply Alice's change, then Bob's → might get one result
- Apply Bob's change, then Alice's → might get a different result (or conflict!)

**In Atomic**, order doesn't matter:
- Apply Alice's change, then Bob's → same graph
- Apply Bob's change, then Alice's → same graph

```text
Alice first, then Bob:          Bob first, then Alice:

    🔴                              🔴
     │                               │
     ├───────┐                       ├───────┐
     ▼       ▼                       ▼       ▼
    🟡      🟣          ===         🟡      🟣
     │       │                       │       │
     └───┬───┘                       └───┬───┘
         │                               │
         ▼                               ▼
        🟢                              🟢

        IDENTICAL RESULT!
```

This is called **commutativity** — the order of operations doesn't change the outcome. It's why Atomic can handle 100+ AI agents making changes simultaneously without chaos.

---

## From Bricks to Code

Let's translate the Lego analogy back to real code:

| Lego Concept | Code Equivalent |
|--------------|-----------------|
| A brick | A line (or chunk) of code |
| Brick above (`up_context`) | The line(s) before this one |
| Brick below (`down_context`) | The line(s) after this one |
| Adding a brick | Inserting new code |
| Removing a brick | Deleting code (with ghost edges) |
| Two bricks claiming same spot | Two people editing the same location |

When you write this code:

```javascript
function greet(name) {
    console.log("Hello, " + name);
}
```

Atomic doesn't snapshot the file. It records:

```text
Line 1: "function greet(name) {"
        up_context: [start of file]
        down_context: [line 2]

Line 2: "    console.log("Hello, " + name);"
        up_context: [line 1]
        down_context: [line 3]

Line 3: "}"
        up_context: [line 2]
        down_context: [end of file]
```

Each line knows its neighbors. The structure is the truth.

---

## The Big Picture

| Traditional VCS (Git) | Atomic |
|-----------------------|--------|
| 📸 Takes photos (snapshots) | 🔗 Tracks connections (graph) |
| 🔍 Compares pixels (text diff) | 🧠 Understands structure (context) |
| 🎲 Guesses merges (heuristics) | ✓ Knows exactly what happened |
| ⚠️ Order-dependent operations | ♾️ Commutative operations |
| 😰 Conflict markers in text | 🎯 Structural conflict resolution |

---

## Try It Yourself

Ready to experience the difference? The best way to understand Atomic is to use it:

```bash
# Create a new repository
atomic init my-project
cd my-project

# Create a file
echo "Hello World" > greeting.txt

# Add and record
atomic add greeting.txt
atomic record -m "Add greeting"

# See the graph structure
atomic log --graph
```

When you make your first merge with Atomic, you'll feel the difference. No more deciphering `<<<<<<<` conflict markers. Just clear, structural understanding of what changed.

---

## Summary

🧱 **Traditional VCS**: Takes photos, compares pixels, guesses at merges

🔗 **Atomic**: Each piece knows its neighbors, structure is explicit, merges are mathematical

The Lego analogy captures Atomic's core insight: **code isn't just text to be photographed — it's a structure to be understood.** By tracking *connections* instead of *snapshots*, Atomic transforms software development from pixel-comparison guesswork into graph-based certainty.

---

<div style={{textAlign: 'center', marginTop: '2rem'}}>

**Next Steps**

[Get Started with Atomic →](/getting-started/installation)

[Understand Change Identity →](/concepts/change-identity)

[Learn About Hunks & Edits →](/concepts/hunks-edit-replacement)

</div>