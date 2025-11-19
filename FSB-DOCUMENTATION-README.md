# FSB Promotion Documentation

## 📚 Created Documentation

I have analyzed and fully visualized the FSB Promotion system action flow in the project. Below are the documentation files:

### 1️⃣ FSB-PROMOTION-FLOW.md
**📄 Detailed Markdown file with all diagrams**

- **13 sections** with Mermaid diagrams
- Detailed explanation of each flow
- Includes:
  - Architecture Overview
  - Server Messages Flow (7 events)
  - UI Handler Display Logic
  - UI Events Map (30+ events)
  - Cascading Slot Integration
  - FSB State Machine
  - Client-Server Communication
  - Notification System (WebSocket)
  - Error Handling
  - Complete Data Flow
  - Typical User Flows
  
**How to use:**
- Open in VS Code to view rendered Mermaid diagrams
- Or copy to GitHub/GitLab to view diagrams
- Use markdown preview extensions in IDE

---

### 2️⃣ FSB-PROMOTION-FLOW.html
**🌐 Interactive HTML Viewer - RECOMMENDED!**

- **10 interactive sections** with navigation menu
- Diagrams rendered real-time with Mermaid.js
- Beautiful UI, easy to read, with animations
- Color-coded sections
- Info boxes and warning boxes
- Legend and descriptions

**How to use:**
1. Double-click file `FSB-PROMOTION-FLOW.html`
2. File will open in default browser
3. Click buttons in navigation bar to view different sections
4. No internet connection needed (Mermaid.js loads from CDN)

**Preview:**
```
┌─────────────────────────────────────┐
│  FSB Promotion Flow                 │
│  Interactive Diagram                │
├─────────────────────────────────────┤
│ [Overview] [Server] [UI] [Events]  │
│ [Cascading] [State] [Client-Server]│
├─────────────────────────────────────┤
│                                     │
│  📊 Diagram displays here          │
│                                     │
│  + Info boxes                       │
│  + Legend                           │
│  + Descriptions                     │
│                                     │
└─────────────────────────────────────┘
```

---

### 3️⃣ FSB-PROMOTION-QUICK-REFERENCE.md
**⚡ Cheatsheet - Quick lookup**

- Compact format
- Tables and code snippets
- Key methods list
- Event reference
- Error codes
- Common scenarios
- Debugging tips
- Checklists

**How to use:**
- Keep this file open when coding
- Use for quick lookup of events, methods, error codes
- Reference when debugging
- Share with new team members

---

## 🎯 Which file to use when?

| Scenario | Recommended File |
|----------|------------------|
| 🔍 **Understand system overview** | `FSB-PROMOTION-FLOW.html` (Overview) |
| 🐛 **Debug issue** | `FSB-PROMOTION-QUICK-REFERENCE.md` |
| 📖 **Read detailed flows** | `FSB-PROMOTION-FLOW.md` |
| 👥 **Present to team** | `FSB-PROMOTION-FLOW.html` |
| 💡 **Lookup method/event** | `FSB-PROMOTION-QUICK-REFERENCE.md` |
| 📚 **Onboard new member** | All 3 files in order |

---

## 📂 FSB Promotion Structure in Project

```
portrait-mahjong-wins/
├── src/extensions/
│   ├── shared-common-slot/
│   │   └── assets/fsb-promotion/
│   │       ├── scripts/
│   │       │   ├── handlers/
│   │       │   │   ├── fsb-promotion-handlers.ts       ← 7 server events
│   │       │   │   └── fsb-promotion-ui-handler.ts     ← UI logic
│   │       │   ├── stores/
│   │       │   │   ├── fsb-promotion-store.ts          ← Data store
│   │       │   │   └── fsb-promotion-ui-store.ts       ← UI state
│   │       │   └── components/
│   │       │       ├── fsb-promotion-dialog.ts
│   │       │       ├── fsb-promotion-info.ts
│   │       │       ├── fsb-web-view.ts
│   │       │       ├── fsb-promotion-bottom-message.ts
│   │       │       └── fsb-promotion-ui-manager.ts
│   │       └── tests/                                  ← Unit tests
│   │
│   ├── shared-cascading-slot/
│   │   └── assets/
│   │       ├── handlers/
│   │       │   ├── slot-bet-handler.ts                 ← FSB integration
│   │       │   └── cascading-ui-handler.ts             ← FSB integration
│   │       └── stores/
│   │           ├── cascading-ui-store.ts               ← FSB integration
│   │           └── bet-control-store.ts                ← FSB integration
│   │
│   └── shared-components/
│       └── assets/
│           └── shared/shared-bundle/audios/
│               └── fsb-promotion.mp3                   ← FSB audio
│
└── [Documentation Files]                               ← You are here!
    ├── FSB-PROMOTION-FLOW.md
    ├── FSB-PROMOTION-FLOW.html
    ├── FSB-PROMOTION-QUICK-REFERENCE.md
    └── FSB-DOCUMENTATION-README.md
```

---

## 🔑 Key Concepts (Summary)

### FSB = Free Spin Bonus Promotion

**Main components:**

1. **FSBPromotionHandlers**: Handles 7 server events
   - Promotion, PromotionTOProgress, ClaimedAmount, RedeemResult
   - FinishPromotion, RedemptionNotice, ClaimedBonusFailed

2. **FSBPromotionUIHandler**: Display logic and user actions
   - Display promotion, gift code, turnover panels
   - Client → Server communication

3. **FSBPromotionStore**: Data from server
   - Promotion data, redemption, turnover, errors

4. **FSBPromotionUIStore**: UI state management
   - FSB state machine (IDLE → READY → SPINNING → FINISHED)
   - Spin count, flags, event queue

**General flow:**
```
Server Event → Handler → Store Update → UI Handler Logic → UI Event → Component Display
```

**Integration with Cascading Slot:**
- SlotBetHandler checks FSB state before betting
- Uses FSB bet settings (coinValue, betLevel)
- Consumes FSB spins when player spins

---

## 🎨 Diagram Types in Documentation

| Diagram Type | Description | Example Use |
|-------------|-------|-------------|
| **Graph TB** | Architecture overview | System components |
| **Sequence Diagram** | Message flow between components | Server → Handler flow |
| **Flowchart** | Decision logic | UI display logic |
| **Mindmap** | Event structure | UI Events hierarchy |
| **State Diagram** | State machine | FSB States |

---

## 🚀 Getting Started (For new team members)

### Step 1: Understand Overview (15 mins)
1. Open `FSB-PROMOTION-FLOW.html` in browser
2. Click "📊 Overview"
3. Read Architecture diagram and Key Components

### Step 2: Read Server Flow (20 mins)
1. Click "🔄 Server Messages"
2. Understand 7 server events
3. View sequence diagram

### Step 3: Understand UI Logic (20 mins)
1. Click "🖥️ UI Handler Flow"
2. Follow decision tree
3. Understand when to show Gift Code, Promotion Info, FSB Banner

### Step 4: View Integration (15 mins)
1. Click "🎮 Cascading Integration"
2. Understand how FSB integrates with slot betting
3. View betting flow sequence diagram

### Step 5: State Machine (10 mins)
1. Click "⚙️ State Machine"
2. Understand 5 states: IDLE, READY, SPINNING, FINISHED, RESUMED
3. View transitions

### Step 6: Practice (30+ mins)
1. Open code in IDE
2. Use Quick Reference for lookup
3. Set breakpoints and debug
4. Verify flow with documentation

**Total time**: ~2 hours to fully understand FSB system

---

## 🐛 Debugging Guide

### When encountering FSB bug, check in order:

1. **Check FSB State**
   ```typescript
   console.log(fsbPromotionUIStore.fsbState)
   // Expected: IDLE | READY | SPINNING | FINISHED | RESUMED
   ```

2. **Check Promotion Data**
   ```typescript
   console.log(fsbPromotionStore.promotion)
   // Has promotion data? isClaimed? isGiftCode?
   ```

3. **Check Spin Count**
   ```typescript
   console.log(fsbPromotionUIStore.currentSpinCount)
   // -1 = not initialized, >= 0 = has FSB spins
   ```

4. **Check Pending Events**
   ```typescript
   console.log(fsbPromotionUIStore.pendingUIEvent)
   // Any pending events?
   ```

5. **Check Flags**
   ```typescript
   console.log({
     consumed: fsbPromotionUIStore.fsbConsumedThisRound,
     finished: fsbPromotionUIStore.hasServerFinishPromotion,
     claimed: fsbPromotionUIStore.hasClaimedBonus,
     resumed: fsbPromotionUIStore.resumedFSBPromotion
   })
   ```

6. **Check Cascading Integration**
   ```typescript
   console.log(fsbPromotionUIStore.isFSBPromotionInProgress)
   // Does SlotBetHandler detect FSB?
   ```

**See more debugging tips in**: `FSB-PROMOTION-QUICK-REFERENCE.md` → "🔍 DEBUGGING TIPS"

---

## 📊 Metrics & Stats

**Code Coverage:**
- ✅ 7 Server Events - Fully documented
- ✅ 30+ UI Events - Fully documented
- ✅ 2 Client Messages - Fully documented
- ✅ 5 FSB States - Fully documented
- ✅ 4 Error Codes - Documented
- ✅ Integration with Cascading Slot - Documented
- ✅ Notification System - Documented

**Files Analyzed:**
- 17 FSB-related TypeScript files
- 100+ methods and properties
- 7 event handlers
- 30+ UI events
- 2 stores (Data + UI State)

---

## 🤝 Contributing

If there are changes in FSB system:

1. **Update documentation** accordingly
2. **Add new diagrams** if there are new flows
3. **Update Quick Reference** if there are new events/methods
4. **Test HTML viewer** after updating diagrams

**Files to update:**
- `FSB-PROMOTION-FLOW.md` - Detailed flows
- `FSB-PROMOTION-FLOW.html` - Interactive viewer
- `FSB-PROMOTION-QUICK-REFERENCE.md` - Quick reference

---

## 💡 Tips & Best Practices

### When reading FSB code:

1. **Start from Handlers**: `fsb-promotion-handlers.ts`
   - View event types being handled
   - Follow flow from handler → store → UI handler

2. **Understand Stores first**: 
   - `FSBPromotionStore` = Data model
   - `FSBPromotionUIStore` = UI state
   - Distinguish clearly between these 2 stores

3. **Follow Event Flow**:
   - Server Event → Handler → Store Update → UI Handler → UI Event → Component

4. **Use Debugger**:
   - Set breakpoints in handlers
   - Watch stores in debug panel
   - Monitor events in console

5. **Check Tests**:
   - Unit tests in `tests/` folder
   - Tests are the best documentation

---

## 📞 Support

If you have questions about FSB Promotion:

1. **Check Quick Reference first**: `FSB-PROMOTION-QUICK-REFERENCE.md`
2. **View HTML diagrams**: `FSB-PROMOTION-FLOW.html`
3. **Read detailed docs**: `FSB-PROMOTION-FLOW.md`
4. **Check code comments** in source files
5. **Review unit tests** in `tests/` folder

---

## ✨ What's Next?

Suggested improvements for FSB system:

- [ ] Add logging/tracking for FSB events
- [ ] Performance monitoring for FSB flows
- [ ] Error recovery mechanisms
- [ ] Better user feedback for errors
- [ ] Analytics integration
- [ ] A/B testing framework

---

## 📝 Changelog

**Version 1.0** (2025-11-19)
- ✅ Initial documentation creation
- ✅ 13 detailed flow diagrams
- ✅ Interactive HTML viewer
- ✅ Quick reference cheatsheet
- ✅ Complete architecture overview
- ✅ Integration points documented

---

**Created by**: AI Assistant  
**Date**: November 19, 2025  
**Project**: Portrait Mahjong Wins  
**Module**: FSB Promotion (shared-common-slot)  

**Feedback welcome!** 🙏

