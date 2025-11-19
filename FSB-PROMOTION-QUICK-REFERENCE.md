# FSB Promotion - Quick Reference

## 🎯 TÓM TẮT NHANH

### Các File Chính
```
shared-common-slot/assets/fsb-promotion/scripts/
├── handlers/
│   ├── fsb-promotion-handlers.ts          ← 7 server events
│   └── fsb-promotion-ui-handler.ts        ← UI logic & client actions
├── stores/
│   ├── fsb-promotion-store.ts             ← Data store
│   └── fsb-promotion-ui-store.ts          ← UI state & FSB state machine
└── components/
    ├── fsb-promotion-dialog.ts
    ├── fsb-promotion-info.ts
    ├── fsb-web-view.ts
    ├── fsb-promotion-bottom-message.ts
    └── fsb-promotion-ui-manager.ts
```

---

## 📨 7 SERVER EVENTS

| Event | Handler Method | Description |
|-------|---------------|-------------|
| **Promotion** | `handlePromotion()` | Nhận promotion data mới |
| **PromotionTOProgress** | `handlePromotionTOProgress()` | TurnOver progress update |
| **ClaimedAmount** | `handleClaimedAmount()` | Confirm claim bonus success |
| **RedeemResult** | `handleRedeemResult()` | Redeem gift code result |
| **FinishPromotion** | `handleFinishPromotion()` | End promotion |
| **RedemptionNotice** | `handleRedemptionNotice()` | Redemption error notice |
| **ClaimedBonusFailed** | `handleClaimedBonusFailed()` | Claim bonus failed |

---

## 🔄 FSB STATE MACHINE

| State | Condition | Description |
|-------|-----------|-------------|
| **IDLE** | `!hasPromo()` | Không có promotion |
| **READY** | `currentSpinCount >= 0` && `!fsbConsumedThisRound` | Sẵn sàng spin FSB |
| **SPINNING** | `fsbConsumedThisRound = true` | Đang spin FSB |
| **FINISHED** | `hasServerFinishPromotion = true` | Đã kết thúc |
| **RESUMED** | `resumedFSBPromotion = true` | Resume từ session trước |

---

## 🎮 KEY METHODS

### FSBPromotionHandlers
```typescript
handlePromotion(data)              // Process new promotion
updatePromotion(data)              // Update current promotion
handlePromotionTOProgress(data)    // Handle turnover progress
handleClaimedAmount(amount)        // Handle successful claim
handleFinishPromotion(data)        // Handle promotion end
handleRedemptionNotice(data)       // Handle redemption errors
handleClaimedBonusFailed(errorCode) // Handle claim errors
initNotificationListeners()        // Start WebSocket listener
removeNotificationListeners()      // Stop WebSocket listener
```

### FSBPromotionUIHandler
```typescript
handlePromotionDisplay()           // Main display logic
handleDirectOpen()                 // Decision tree cho display
openPromotionInfo(isAutoPlay)      // Open promotion info dialog
claimBonusWin()                    // Send claim bonus request
redeemGiftCode(giftCode)           // Send redeem request
tryConsumeFSB()                    // Consume 1 FSB spin
undoLastFSBSpin()                  // Undo last spin
commitFSBSpins()                   // Commit FSB consumption
updateTotalWin({win, totalFreeSpins}) // Update after spin
markFSBEndFromServer()             // Mark server-side end
openTurnOverRequired(context)      // Open TO panel
onReceivedTOProgressData(data)     // Handle TO updates
```

### FSBPromotionStore (Data)
```typescript
promotion: Promotion               // Current promotion data
nextPromotion: Promotion           // Queued next promotion
finishPromotion: FinishPromotion   // Finish promotion data
promotionTOProgress: PromotionTOProgress // TurnOver data
redemptionNotice: RedemptionNotice // Redemption errors
claimedAmount: number              // Claimed amount
claimedBonusFailed: string         // Error code
redeemStatus: RedeemStatus         // Redeem status

reset()                            // Reset all data
isRedeemSuccess                    // Getter for redeem success
isClaimed                          // Getter for is claimed
```

### FSBPromotionUIStore (UI State)
```typescript
currentSpinCount: number           // Remaining FSB spins
fsbConsumedThisRound: boolean      // Consumed this round?
hasServerFinishPromotion: boolean  // Server confirmed end?
hasClaimedBonus: boolean           // Has claimed bonus?
resumedFSBPromotion: boolean       // Resumed FSB?
pendingUIEvent: {event, data}      // UI event queue
toProgress: ITurnOverRequired      // TurnOver data
fsbState: FSBPromotionState        // Current FSB state

tryConsumeFSB()                    // Try consume 1 spin
undoLastFSBSpin()                  // Undo consumption
commitFSB()                        // Commit consumption
addPendingUIEvent(event, data)     // Add UI event
removePendingUIEvent()             // Remove UI event
updateTOProgress(data)             // Update TO data
reset()                            // Reset all state
```

---

## 📢 UI EVENTS (30+ Events)

### Display Events
```typescript
OPEN_FREE_SPINS_PROMOTION         // Open FSB banner/dialog
OPEN_PROMOTION_INFO               // Open promotion info
OPEN_PROMOTION_ENDED_POPUP        // Open ended popup
CLOSE_FREE_SPINS_PROMOTION        // Close FSB dialog
CLOSE_PROMOTION_DETAILS_PANEL     // Close details panel
CLOSE_FSB_BANNER                  // Close FSB banner
```

### Gift Code Events
```typescript
OPEN_GIFT_CODE                    // Open gift code input
OPEN_GIFT_CODE_REDEEM_POPUP       // Open redeem popup
REDEMPTION_NOTICE                 // Show redemption notice
CLOSE_GIFT_CODE_ICON              // Close gift code icon
HIDE_GIFT_CODE_ICON               // Hide gift code icon
EFFECT_REDEEM_SUCCESS             // Redeem success animation
```

### FSB Spin Events
```typescript
SPIN_ON_FSB_PROMOTION             // Spin on FSB
SPIN_ON_FSB_PROMOTION_FIRST_TIME  // First FSB spin
BEGIN_USING_FBS                   // Start using FSB
UPDATE_FSB_COUNT                  // Update remaining count
UPDATE_TOTAL_WIN                  // Update total win amount
```

### Bonus Events
```typescript
CLAIMED_BONUS_SUCCESS             // Claim success
EXPIRE_CLAIM_BONUS                // Claim expired
OPEN_CLAIM_BONUS_NOTIFICATION     // Open claim notification
UPDATE_BALANCE_BONUS              // Update balance
```

### TurnOver Events
```typescript
OPEN_TURN_OVER_REQUIRED           // Open TO panel
UPDATE_TURN_OVER_REQUIRED         // Update TO progress
```

### Effect Events
```typescript
OPEN_REDEEM_TRANSITION_EFFECT     // Redeem transition
EFFECT_UNBOX_GIFT                 // Unbox gift animation
EFFECT_COIN_ANIMATION             // Coin animation
```

---

## 🎮 CASCADING SLOT INTEGRATION

### SlotBetHandler
```typescript
// Check FSB state before betting
if (fsbPromotionUIStore.isFSBPromotionInProgress) {
    // Use FSB promotion bet settings
    coinValue = fsbPromotionStore.promotion.coinValue
    betLevel = fsbPromotionStore.promotion.betLevel
    
    // Consume FSB spin
    fsbPromotionUIHandler.tryConsumeFSB()
}
```

### CascadingUIHandler
```typescript
handleFreespinsJoinGame(freespins) {
    if (freespins.promotionId) {
        fsbPromotionUIStore.resumedFSBPromotion = true
    }
    // ... rest of freespins handling
}
```

---

## 🔢 ERROR CODES

| Code | Meaning | UI Event |
|------|---------|----------|
| **SB3019** | Gift code error | REDEMPTION_NOTICE |
| **SB3020** | Invalid gift code | REDEMPTION_NOTICE |
| **SB3021** | Unexpected error | REDEMPTION_NOTICE |
| **SB3023** | Claim bonus expired | EXPIRE_CLAIM_BONUS |
| **Other** | Generic error | SHOW_NOTICE_ERROR |

---

## 🔔 NOTIFICATION (WebSocket)

```typescript
// Init listener (khi có PromotionTOProgress)
notificationStore.connection.on("promotionProgress", handleNotificationReceived)

// Handler receives real-time updates
handleNotificationReceived = (data: PromotionTOProgress) => {
    fsbPromotionUIHandler.onReceivedTOProgressData(data)
}

// Cleanup (khi done)
notificationStore.connection.off("promotionProgress", handleNotificationReceived)
```

---

## 📡 CLIENT → SERVER MESSAGES

### Redeem Gift Code
```typescript
connectionStore.send(
    GameClientMessageSlot.RedeemGifCode.eventName, 
    { giftCode: string }
)
```

### Claim Bonus Win
```typescript
connectionStore.send(
    GameClientMessageSlot.ClaimBonusWin.eventName, 
    null
)
```

---

## 🎯 COMMON SCENARIOS

### Scenario 1: User Receives Gift Code
```
1. Server sends: Promotion (isGiftCode=true, isClaimed=false)
2. handlePromotion() → updatePromotion()
3. handlePromotionDisplay() → shouldShowGiftCode() = true
4. UI Event: OPEN_GIFT_CODE
5. User enters code → redeemGiftCode(code)
6. Server response: RedeemResult / RedemptionNotice
7. If success: OPEN_FREE_SPINS_PROMOTION
```

### Scenario 2: User Plays FSB
```
1. Server sends: Promotion (isClaimed=true)
2. UI Event: OPEN_PROMOTION_INFO
3. User clicks spin
4. SlotBetHandler checks: isFSBPromotionInProgress = true
5. Get FSB bet settings (coinValue, betLevel)
6. tryConsumeFSB() → currentSpinCount--
7. UI Event: UPDATE_FSB_COUNT
8. If first spin: BEGIN_USING_FBS
9. Spin executes
10. updateTotalWin() → UPDATE_TOTAL_WIN
11. Repeat until currentSpinCount = 0
12. Server sends: FinishPromotion
13. UI Event: OPEN_PROMOTION_ENDED_POPUP
```

### Scenario 3: TurnOver Requirement
```
1. Server sends: FinishPromotion (totalWin > 0)
2. Server sends: PromotionTOProgress
3. initNotificationListeners() - start WebSocket
4. UI Event: OPEN_TURN_OVER_REQUIRED
5. User plays to complete turnover
6. Real-time updates: "promotionProgress" notifications
7. UI Event: UPDATE_TURN_OVER_REQUIRED (multiple times)
8. Progress reaches 100%
9. User clicks Claim Bonus
10. claimBonusWin() sent to server
11. Server response: ClaimedAmount
12. UI Event: CLAIMED_BONUS_SUCCESS
13. removeNotificationListeners() - cleanup
```

---

## 🔍 DEBUGGING TIPS

### Check FSB State
```typescript
// In browser console or debugger
fsbPromotionUIStore.fsbState          // IDLE | READY | SPINNING | FINISHED | RESUMED
fsbPromotionUIStore.currentSpinCount  // Remaining spins
fsbPromotionUIStore.fsbConsumedThisRound // Consumed this round?
fsbPromotionStore.promotion           // Promotion data
```

### Check Pending Events
```typescript
fsbPromotionUIStore.pendingUIEvent    // Current pending event
fsbPromotionUIStore.event             // Current event
```

### Check Flags
```typescript
fsbPromotionUIStore.hasServerFinishPromotion  // Server confirmed end?
fsbPromotionUIStore.hasClaimedBonus           // Claimed bonus?
fsbPromotionUIStore.resumedFSBPromotion       // Resumed?
fsbPromotionUIStore.isTrialMode               // In trial mode?
```

---

## 📚 RELATED MODULES

### Cascading Slot
- **Path**: `shared-cascading-slot/assets/`
- **Key Files**: 
  - `handlers/slot-bet-handler.ts`
  - `handlers/cascading-ui-handler.ts`
  - `stores/cascading-ui-store.ts`
  - `stores/bet-control-store.ts`

### Shared Components
- **Path**: `shared-components/assets/`
- **Integration**: UI components, audio, utilities
- **Audio**: `shared/shared-bundle/audios/fsb-promotion.mp3`

---

## 🛠️ TECH STACK

- **State Management**: MobX (`mobx.makeAutoObservable`)
- **Dependency Injection**: Inversify (`@injectable`, `@inject`)
- **Game Framework**: `@sg/game-client-base`
- **Communication**: WebSocket (notifications), HTTP (messages)
- **Pattern**: Event-driven architecture với UI event queue

---

## ⚡ PERFORMANCE NOTES

1. **Event Queue**: Chỉ xử lý 1 pending event tại 1 thời điểm
2. **State Calculation**: `fsbState` là computed property (không store)
3. **Notification**: Chỉ subscribe khi cần (có TurnOver)
4. **Memory**: Luôn cleanup listeners khi done
5. **MobX Reactions**: Sử dụng `reaction()` cho side effects

---

## 📝 CHECKLISTS

### Khi Add New Feature
- [ ] Check nếu cần thêm UI event mới
- [ ] Update FSBPromotionUIStore nếu cần state mới
- [ ] Update handlers nếu cần xử lý server event mới
- [ ] Test với cascading slot integration
- [ ] Test trial mode behavior
- [ ] Test error handling

### Khi Debug Issue
- [ ] Check FSB state (`fsbState`)
- [ ] Check pending events (`pendingUIEvent`)
- [ ] Check server flags (`hasServerFinishPromotion`, etc.)
- [ ] Check notification listener status
- [ ] Check cascading slot integration
- [ ] Check error codes và error handling

---

**Quick Reference Version 1.0**  
**Created**: 2025-11-19  
**For**: Portrait Mahjong Wins Project

