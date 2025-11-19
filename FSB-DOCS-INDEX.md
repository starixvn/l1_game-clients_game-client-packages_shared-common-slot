# 📑 FSB Promotion Documentation Index

## 🎯 START HERE!

Welcome to FSB Promotion documentation! This is a complete documentation package for the FSB system.

---

## 📚 DOCUMENTATION FILES

### 🌟 1. FSB-DOCUMENTATION-README.md
**🔰 READ THIS FILE FIRST!**

- Complete documentation usage guide
- Getting started guide for beginners
- Debugging guide
- Best practices
- **→ OPEN THIS FILE TO LEARN HOW TO USE OTHER FILES**

---

### 🌐 2. FSB-PROMOTION-FLOW.html ⭐ RECOMMENDED
**Interactive Viewer - View in Browser**

```
✅ Open by: Double-clicking the file
✅ No installation needed
✅ Easy navigation with menu buttons
✅ 10 sections with beautiful diagrams
```

**Sections:**
1. 📊 Overview - Architecture overview
2. 🔄 Server Messages - 7 server events flow
3. 🖥️ UI Handler Flow - UI display logic
4. 📢 UI Events - Map of 30+ events
5. 🎮 Cascading Integration - Slot integration
6. ⚙️ State Machine - FSB states
7. 📡 Client ↔ Server - Communication
8. 🔔 Notifications - WebSocket system
9. ⚠️ Error Handling - Error flows
10. 🗺️ Complete Flow - Complete system

**BEST FOR:**
- Understanding system overview
- Team presentations
- Onboarding new members
- Visual learners

---

### 📄 3. FSB-PROMOTION-FLOW.md
**Markdown Document - Complete Details**

```
✅ Open in VS Code with Markdown Preview
✅ 13 sections with Mermaid diagrams
✅ Detailed explanation of each flow
✅ Can be committed to Git
```

**Contents:**
- Architecture Overview
- Server Messages → Handlers Flow
- UI Handler Promotion Display Flow
- FSB Promotion UI Events
- FSB Integration with Cascading Slot
- FSB State Machine
- Client → Server Messages
- Notification System (WebSocket)
- Error Handling Flow
- Complete Data Flow
- Key Stores & Responsibilities
- Integration Points
- Typical User Flows (3 detailed scenarios)

**BEST FOR:**
- Reading detailed technical details
- Reference when implementing features
- Code review
- Documentation in Git

---

### ⚡ 4. FSB-PROMOTION-QUICK-REFERENCE.md
**Cheatsheet - Quick Lookup**

```
✅ Compact format
✅ Tables, code snippets
✅ Quick lookup
✅ Print-friendly
```

**Contents:**
- 📨 7 Server Events table
- 🔄 FSB State Machine table
- 🎮 Key Methods reference
- 📢 30+ UI Events list
- 🔢 Error Codes mapping
- 🎯 Common Scenarios
- 🔍 Debugging Tips
- 📝 Checklists

**BEST FOR:**
- Quick lookup for methods/events
- Debug issues
- Quick reference while coding
- Print and keep nearby

---

### 📑 5. FSB-DOCS-INDEX.md (this file)
**Index - Navigation file**

Quick guide to files in the documentation package.

---

## 🚀 QUICK START GUIDE

### If you are... 

#### 👶 **NEWCOMER** (knows nothing about FSB)
```
1. ✅ Read: FSB-DOCUMENTATION-README.md ("Getting Started" section)
2. ✅ Open: FSB-PROMOTION-FLOW.html → Click "Overview"
3. ✅ View sections sequentially in HTML
4. ✅ Keep Quick Reference nearby when starting to code
```
⏱️ **Time needed**: 2 hours

---

#### 🔧 **DEVELOPER** (need to implement new feature)
```
1. ✅ View: FSB-PROMOTION-FLOW.html → Related section
2. ✅ Read: FSB-PROMOTION-FLOW.md → Technical details
3. ✅ Lookup: FSB-PROMOTION-QUICK-REFERENCE.md → Methods/Events
4. ✅ Code with reference nearby
```
⏱️ **Time needed**: 30-45 mins

---

#### 🐛 **DEBUGGING** (fixing a bug)
```
1. ✅ Open: FSB-PROMOTION-QUICK-REFERENCE.md → "Debugging Tips"
2. ✅ Check: FSB State, Flags, Events per checklist
3. ✅ View: FSB-PROMOTION-FLOW.html → Flow related to bug
4. ✅ Trace code according to diagram
```
⏱️ **Time needed**: 15-30 mins

---

#### 👥 **TEAM LEAD** (need to present/train)
```
1. ✅ Prepare: FSB-PROMOTION-FLOW.html (open in browser)
2. ✅ Present: Sequentially follow sections in HTML
3. ✅ Share: FSB-DOCUMENTATION-README.md with team
4. ✅ Print: FSB-PROMOTION-QUICK-REFERENCE.md as handout
```
⏱️ **Time needed**: 1-2 hours session

---

#### 📖 **CODE REVIEWER**
```
1. ✅ Reference: FSB-PROMOTION-FLOW.md → Detailed flows
2. ✅ Check: Does code follow documented flow
3. ✅ Verify: Events, States, Handlers correctness
4. ✅ Quick lookup: FSB-PROMOTION-QUICK-REFERENCE.md
```
⏱️ **Time needed**: As needed

---

## 📊 DOCUMENTATION COVERAGE

```
✅ Server Events:        7/7     (100%)
✅ UI Events:            30+     (100%)
✅ Client Messages:      2/2     (100%)
✅ FSB States:           5/5     (100%)
✅ Error Codes:          4+      (100%)
✅ Integration Points:   Full    (100%)
✅ Handlers:             2/2     (100%)
✅ Stores:               2/2     (100%)
```

**Total**: 100+ methods, properties, and flows documented ✨

---

## 🎨 DIAGRAM TYPES

The documentation contains the following diagram types:

| Type | Description | Count |
|------|-------------|-------|
| **Graph TB** | Architecture, component relationships | 3 |
| **Sequence** | Message flows, interactions | 4 |
| **Flowchart** | Decision logic, processes | 2 |
| **Mindmap** | Event structures | 1 |
| **State Diagram** | State machines | 1 |

**Total**: 11+ diagrams across all documents

---

## 🔗 RELATED TO SOURCE CODE

### FSB Promotion Core
```
src/extensions/shared-common-slot/assets/fsb-promotion/
├── scripts/
│   ├── handlers/
│   │   ├── fsb-promotion-handlers.ts          ← 7 server events
│   │   └── fsb-promotion-ui-handler.ts        ← UI logic
│   ├── stores/
│   │   ├── fsb-promotion-store.ts             ← Data store
│   │   └── fsb-promotion-ui-store.ts          ← UI state
│   └── components/                            ← UI components
└── tests/                                     ← Unit tests
```

### Integration Points
```
src/extensions/shared-cascading-slot/assets/
├── handlers/
│   ├── slot-bet-handler.ts                    ← FSB bet integration
│   └── cascading-ui-handler.ts                ← FSB UI integration
└── stores/
    └── cascading-ui-store.ts                  ← FSB state coordination
```

---

## 🎯 USE CASES

### Use Case 1: "I need to understand what FSB does?"
→ **Open**: `FSB-PROMOTION-FLOW.html` → Section "Overview"

### Use Case 2: "When is event X triggered?"
→ **Lookup**: `FSB-PROMOTION-QUICK-REFERENCE.md` → UI Events section

### Use Case 3: "How is server event Y handled?"
→ **View**: `FSB-PROMOTION-FLOW.html` → "Server Messages" section

### Use Case 4: "How does FSB state machine work?"
→ **View**: `FSB-PROMOTION-FLOW.html` → "State Machine" section

### Use Case 5: "How does FSB integrate with slot betting?"
→ **View**: `FSB-PROMOTION-FLOW.html` → "Cascading Integration"

### Use Case 6: "How to debug FSB issue?"
→ **Read**: `FSB-PROMOTION-QUICK-REFERENCE.md` → "Debugging Tips"

### Use Case 7: "What does error code ABC mean?"
→ **Lookup**: `FSB-PROMOTION-QUICK-REFERENCE.md` → "Error Codes" table

### Use Case 8: "Need to present FSB to team"
→ **Use**: `FSB-PROMOTION-FLOW.html` (interactive viewer)

---

## 💡 TIPS

### ⭐ Top 3 Most Useful Files:

1. **FSB-PROMOTION-FLOW.html** - Visual overview, presentations
2. **FSB-PROMOTION-QUICK-REFERENCE.md** - Daily coding reference
3. **FSB-DOCUMENTATION-README.md** - Getting started, debugging

### 📌 Bookmark These Sections:

- **Common Scenarios** (in Quick Reference) - Typical flows
- **Debugging Tips** (in Quick Reference) - Debug guide
- **State Machine** (in HTML) - Understand FSB states
- **Error Handling** (in HTML) - Handle errors properly

### 🖨️ Print Friendly:

- `FSB-PROMOTION-QUICK-REFERENCE.md` - Best for printing
- Tables and code snippets are easy to read when printed

---

## 📞 QUESTIONS?

### "I don't know where to start?"
→ Read `FSB-DOCUMENTATION-README.md` section "Getting Started"

### "I need quick info about method X?"
→ Lookup `FSB-PROMOTION-QUICK-REFERENCE.md`

### "I want to understand technical deep dive?"
→ Read `FSB-PROMOTION-FLOW.md`

### "I prefer visual diagrams?"
→ Open `FSB-PROMOTION-FLOW.html`

### "I'm debugging and need quick help?"
→ `FSB-PROMOTION-QUICK-REFERENCE.md` → Debugging Tips + Checklists

---

## 🎓 LEARNING PATH

**Beginner → Advanced:**

```
Level 1 (Beginner):
  ↓
[HTML Overview] → Hiểu architecture
  ↓
[HTML Server Flow] → Hiểu 7 events
  ↓
[HTML UI Flow] → Hiểu display logic
  ↓
Level 2 (Intermediate):
  ↓
[HTML State Machine] → Hiểu FSB states
  ↓
[HTML Cascading] → Hiểu integration
  ↓
[Quick Ref] → Học methods/events
  ↓
Level 3 (Advanced):
  ↓
[Full MD Doc] → Deep dive technical
  ↓
[Source Code] → Đọc implementation
  ↓
[Unit Tests] → Verify understanding
  ↓
🎓 MASTER FSB!
```

---

## ✅ CHECKLIST

### For New Team Member:
- [ ] Read FSB-DOCUMENTATION-README.md
- [ ] View complete FSB-PROMOTION-FLOW.html (10 sections)
- [ ] Bookmark FSB-PROMOTION-QUICK-REFERENCE.md
- [ ] Clone repo and open code
- [ ] Set breakpoints and debug following diagrams
- [ ] Read unit tests in `tests/` folder
- [ ] Implement a small feature to practice

### For Code Reviewer:
- [ ] Review code changes
- [ ] Check against FSB-PROMOTION-FLOW.md
- [ ] Verify event flows are correct
- [ ] Verify state transitions are correct
- [ ] Check error handling
- [ ] Verify integration with cascading slot

### For Maintainer:
- [ ] Code changes → Update documentation
- [ ] New events → Update Quick Reference
- [ ] New flows → Update diagrams
- [ ] Test HTML viewer after changes
- [ ] Update changelog in README

---

## 📈 VERSION HISTORY

**v1.0** (2025-11-19)
- ✅ Initial complete documentation package
- ✅ 4 main documentation files
- ✅ 11+ Mermaid diagrams
- ✅ Interactive HTML viewer
- ✅ Quick reference cheatsheet
- ✅ Comprehensive README
- ✅ This index file

---

## 🌟 HIGHLIGHTS

```
✨ 100% Coverage of FSB system
✨ Interactive HTML viewer with 10 sections
✨ 11+ professional Mermaid diagrams
✨ Quick reference cheatsheet
✨ Debugging guide & checklists
✨ Common scenarios documented
✨ Integration points fully covered
✨ Error handling documented
✨ State machine visualized
✨ Ready for team use
```

---

## 🎉 ENJOY!

This documentation was created to help you and your team understand the FSB Promotion system thoroughly.

**Next steps:**
1. Read `FSB-DOCUMENTATION-README.md`
2. Open `FSB-PROMOTION-FLOW.html` in browser
3. Enjoy exploring! 🚀

---

**Created**: 2025-11-19  
**For**: Portrait Mahjong Wins Project  
**Module**: FSB Promotion (Free Spin Bonus)

**Happy Coding! 💻✨**

