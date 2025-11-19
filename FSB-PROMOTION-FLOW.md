# FSB Promotion Action Flow Diagram

## Overview
FSB (Free Spin Bonus) Promotion is a system for managing free spin promotion campaigns in the game. The flow includes many actions from the server, processed through handlers, updating stores, and triggering UI events.

---

## 1. ARCHITECTURE OVERVIEW

```mermaid
graph TB
    Server[Game Server] --> Handlers[FSB Promotion Handlers]
    Handlers --> Store[FSB Promotion Store]
    Handlers --> UIHandler[FSB Promotion UI Handler]
    UIHandler --> UIStore[FSB Promotion UI Store]
    UIStore --> UIEvents[UI Events Queue]
    UIEvents --> Components[UI Components]
    
    CascadingSlot[Cascading Slot Module] --> UIHandler
    CascadingSlot --> UIStore
    
    style Server fill:#e1f5ff
    style Handlers fill:#fff3cd
    style UIHandler fill:#fff3cd
    style Store fill:#d4edda
    style UIStore fill:#d4edda
    style UIEvents fill:#f8d7da
    style Components fill:#d1ecf1
```

---

## 2. SERVER MESSAGES → HANDLERS FLOW

```mermaid
sequenceDiagram
    participant Server as Game Server
    participant Handler as FSBPromotionHandlers
    participant Store as FSBPromotionStore
    participant UIHandler as FSBPromotionUIHandler
    participant UIStore as FSBPromotionUIStore
    
    Note over Server,UIStore: 7 Server Events are handled
    
    rect rgb(230, 240, 255)
        Note right of Server: 1. PROMOTION EVENT
        Server->>Handler: Promotion Message
        Handler->>Handler: handlePromotion(data)
        alt hasServerFinishPromotion OR hasClaimedBonus
            Handler->>Store: nextPromotion = data
        else
            Handler->>Handler: updatePromotion(data)
            Handler->>UIStore: reset()
            Handler->>Store: promotion = data
            Handler->>UIHandler: handlePromotionDisplay()
        end
    end
    
    rect rgb(255, 240, 230)
        Note right of Server: 2. PROMOTION TO PROGRESS
        Server->>Handler: PromotionTOProgress Message
        Handler->>Store: promotionTOProgress = data
        Handler->>UIStore: toProgress = data
        Handler->>UIHandler: openTurnOverRequired("in-game")
        Handler->>Handler: initNotificationListeners()
    end
    
    rect rgb(230, 255, 240)
        Note right of Server: 3. CLAIMED AMOUNT
        Server->>Handler: ClaimedAmount Message
        Handler->>UIStore: hasClaimedBonus = true
        Handler->>Store: claimedAmount = amount
        Handler->>UIHandler: claimedBonusSuccess()
        UIHandler->>UIStore: addPendingUIEvent(CLAIMED_BONUS_SUCCESS)
    end
    
    rect rgb(255, 230, 240)
        Note right of Server: 4. REDEEM RESULT
        Server->>Handler: RedeemResult Message
        Handler->>Store: redeemResult = result
    end
    
    rect rgb(240, 230, 255)
        Note right of Server: 5. FINISH PROMOTION
        Server->>Handler: FinishPromotion Message
        Handler->>Store: finishPromotion = data
        Handler->>Store: reset()
        Handler->>UIHandler: markFSBEndFromServer()
        UIHandler->>UIStore: markServerConfirmedEnd()
    end
    
    rect rgb(255, 250, 230)
        Note right of Server: 6. REDEMPTION NOTICE
        Server->>Handler: RedemptionNotice Message
        Handler->>Store: redemptionNotice = data
        Handler->>UIHandler: handleRedemptionNotice()
        UIHandler->>UIHandler: mapErrorCodeToMessageKey()
        UIHandler->>UIStore: addPendingUIEvent(REDEMPTION_NOTICE)
    end
    
    rect rgb(230, 255, 255)
        Note right of Server: 7. CLAIMED BONUS FAILED
        Server->>Handler: ClaimedBonusFailed Message
        Handler->>Store: claimedBonusFailed = errorCode
        alt errorCode === "SB3023"
            Handler->>UIStore: addPendingUIEvent(EXPIRE_CLAIM_BONUS)
        else
            Handler->>UIStore: addPendingUIEvent(SHOW_NOTICE_ERROR)
        end
    end
```

---

## 3. UI HANDLER PROMOTION DISPLAY FLOW

```mermaid
flowchart TD
    Start[handlePromotionDisplay] --> Check1{activeTransitionEffect}
    Check1 -->|Yes| End[Return]
    Check1 -->|No| Check2{hasPromo}
    Check2 -->|No| End
    Check2 -->|Yes| Check3{isTrialMode}
    Check3 -->|Yes| End
    Check3 -->|No| Check4{shouldSkipPromo}
    Check4 -->|Yes| End
    Check4 -->|No| DirectOpen[handleDirectOpen]
    
    DirectOpen --> CheckSkipGiftCode{skipGiftCode}
    CheckSkipGiftCode -->|Yes| OpenInfo[openPromotionInfo]
    CheckSkipGiftCode -->|No| CheckGiftCode{shouldShowGiftCode}
    
    CheckGiftCode -->|Yes| Event1[addPendingUIEvent<br/>OPEN_GIFT_CODE]
    CheckGiftCode -->|No| CheckClaimed{Is claimed with<br/>no spins used}
    
    CheckClaimed -->|Yes| Event2[addPendingUIEvent<br/>OPEN_FREE_SPINS_PROMOTION]
    CheckClaimed -->|No| OpenInfo
    
    Event1 --> End
    Event2 --> End
    OpenInfo --> End
    
    style Start fill:#4CAF50,color:#fff
    style End fill:#f44336,color:#fff
    style Event1 fill:#2196F3,color:#fff
    style Event2 fill:#2196F3,color:#fff
    style OpenInfo fill:#FF9800,color:#fff
```

---

## 4. FSB PROMOTION UI EVENTS

```mermaid
mindmap
  root((FSB UI Events))
    Gift Code Flow
      OPEN_GIFT_CODE
      OPEN_GIFT_CODE_REDEEM_POPUP
      CLOSE_GIFT_CODE_ICON
      CLOSE_GIFT_CODE_REDEEM_POPUP
      HIDE_GIFT_CODE_ICON
      REDEMPTION_NOTICE
      EFFECT_REDEEM_SUCCESS
    Promotion Display
      OPEN_FREE_SPINS_PROMOTION
      OPEN_PROMOTION_INFO
      OPEN_PROMOTION_ENDED_POPUP
      CLOSE_FREE_SPINS_PROMOTION
      CLOSE_PROMOTION_DETAILS_PANEL
      CLOSE_FSB_BANNER
    FSB Spin Actions
      SPIN_ON_FSB_PROMOTION
      SPIN_ON_FSB_PROMOTION_FIRST_TIME
      UPDATE_FSB_COUNT
      UPDATE_TOTAL_WIN
      BEGIN_USING_FBS
    Bonus Claim
      CLAIMED_BONUS_SUCCESS
      EXPIRE_CLAIM_BONUS
      OPEN_CLAIM_BONUS_NOTIFICATION
      UPDATE_BALANCE_BONUS
    TurnOver Required
      OPEN_TURN_OVER_REQUIRED
      UPDATE_TURN_OVER_REQUIRED
    Effects & UI
      OPEN_REDEEM_TRANSITION_EFFECT
      EFFECT_UNBOX_GIFT
      EFFECT_COIN_ANIMATION
      SHOW_FREE_SPIN_MESSAGE
      SHOW_NOTICE_ERROR
    Node Management
      DESTROY_GIFT_CODE_NODE
      DESTROY_BANNER_NODE
      DESTROY_PROMOTION_ENDED_POPUP_NODE
      COLLAPSE_MENU
```

---

## 5. FSB INTEGRATION WITH CASCADING SLOT

```mermaid
sequenceDiagram
    participant Player as Player Action
    participant BetHandler as SlotBetHandler
    participant UIStore as FSBPromotionUIStore
    participant UIHandler as FSBPromotionUIHandler
    participant CascadingUI as CascadingUIHandler
    participant Store as FSBPromotionStore
    participant Server as Game Server
    
    Note over Player,Server: FSB BETTING FLOW
    
    Player->>BetHandler: Click Spin
    BetHandler->>UIStore: Check isFSBPromotionInProgress
    
    alt FSB Promotion Active
        BetHandler->>Store: Get promotion.coinValue
        BetHandler->>Store: Get promotion.betLevel
        Note right of BetHandler: Use FSB promotion bet settings
        BetHandler->>UIStore: changeUserBalance = true
        BetHandler->>UIHandler: tryConsumeFSB()
        UIHandler->>UIStore: tryConsumeFSB()
        UIStore->>UIStore: currentSpinCount--
        UIStore->>UIStore: fsbConsumedThisRound = true
        UIStore->>UIStore: addPendingUIEvent(UPDATE_FSB_COUNT)
        
        alt First FSB Spin
            UIStore->>UIStore: setEvent(BEGIN_USING_FBS)
        end
        
        BetHandler->>CascadingUI: changeCascadingState(SPINNING)
        BetHandler->>Server: Send Bet Request
    else Normal Betting
        BetHandler->>BetHandler: Use normal bet settings
        BetHandler->>Server: Send Bet Request
    end
    
    Note over Player,Server: AFTER SPIN RESULT
    
    Server->>CascadingUI: Settlement Result
    CascadingUI->>UIHandler: updateTotalWin({win, totalFreeSpins})
    
    alt isUpdateTotalWin
        UIHandler->>UIStore: addPendingUIEvent(UPDATE_TOTAL_WIN, win)
        
        alt isLastFreeSpin (totalFreeSpins === 0)
            UIHandler->>UIHandler: commitFSBSpins()
            UIHandler->>UIStore: commitFSB()
            UIStore->>UIStore: fsbConsumedThisRound = false
            UIStore->>UIStore: resumedFSBPromotion = false
        end
    end
    
    Note over Player,Server: HANDLE FREESPINS JOIN GAME
    
    Server->>CascadingUI: handleFreespinsJoinGame(freespins)
    alt has promotionId
        CascadingUI->>UIStore: resumedFSBPromotion = true
    end
```

---

## 6. FSB STATE MACHINE

```mermaid
stateDiagram-v2
    [*] --> IDLE: No Promotion
    
    IDLE --> READY: Receive Promotion<br/>and Set currentSpinCount
    
    READY --> SPINNING: tryConsumeFSB()<br/>fsbConsumedThisRound = true
    
    SPINNING --> READY: commitFSB()<br/>has remaining spins
    
    READY --> FINISHED: Server sends<br/>FinishPromotion
    
    SPINNING --> FINISHED: Server sends<br/>FinishPromotion
    
    IDLE --> RESUMED: Resume FSB with<br/>resumedFSBPromotion = true
    
    RESUMED --> SPINNING: Continue spinning
    
    RESUMED --> FINISHED: Complete all spins
    
    FINISHED --> IDLE: Reset and Clear<br/>promotion data
    
    note right of IDLE
        hasPromo: false
        currentSpinCount: not set
    end note
    
    note right of READY
        hasPromo: true
        currentSpinCount: available
        fsbConsumedThisRound: false
    end note
    
    note right of SPINNING
        currentSpinCount: available
        fsbConsumedThisRound: true
    end note
    
    note right of FINISHED
        hasServerFinishPromotion: true
    end note
    
    note right of RESUMED
        resumedFSBPromotion: true
    end note
```

---

## 7. CLIENT → SERVER MESSAGES

```mermaid
flowchart LR
    subgraph Client Actions
        A1[Redeem Gift Code] --> M1[RedeemGifCode]
        A2[Claim Bonus Win] --> M2[ClaimBonusWin]
    end
    
    subgraph Connection
        M1 --> |giftCode| Server[Game Server]
        M2 --> |null| Server
    end
    
    subgraph Server Response
        Server --> R1[RedeemResult]
        Server --> R2[RedemptionNotice]
        Server --> R3[ClaimedAmount]
        Server --> R4[ClaimedBonusFailed]
    end
    
    style A1 fill:#4CAF50,color:#fff
    style A2 fill:#4CAF50,color:#fff
    style Server fill:#2196F3,color:#fff
    style R1 fill:#FF9800,color:#000
    style R2 fill:#FF9800,color:#000
    style R3 fill:#FF9800,color:#000
    style R4 fill:#FF9800,color:#000
```

---

## 8. NOTIFICATION SYSTEM (WebSocket)

```mermaid
sequenceDiagram
    participant Server as Notification Server
    participant NotificationStore as NotificationStore
    participant Handler as FSBPromotionHandlers
    participant UIHandler as FSBPromotionUIHandler
    participant UIStore as FSBPromotionUIStore
    
    Note over Server,UIStore: Real-time TurnOver Progress Updates
    
    Handler->>NotificationStore: initNotificationListeners()
    NotificationStore->>NotificationStore: connection.on("promotionProgress")
    
    loop Real-time Updates
        Server->>NotificationStore: "promotionProgress" event
        NotificationStore->>Handler: handleNotificationReceived(data)
        Handler->>UIHandler: onReceivedTOProgressData(data)
        UIHandler->>UIStore: updateTOProgress(data)
        
        alt Data Changed
            UIStore->>UIStore: toProgress = data
            UIHandler->>UIStore: addPendingUIEvent<br/>(UPDATE_TURN_OVER_REQUIRED)
        end
    end
    
    Note over Handler: When done
    Handler->>NotificationStore: removeNotificationListeners()
    NotificationStore->>NotificationStore: connection.off("promotionProgress")
```

---

## 9. ERROR HANDLING FLOW

```mermaid
flowchart TD
    Start[Error Occurs] --> Type{Error Type}
    
    Type -->|Gift Code Error| GiftCodeErr[RedemptionNotice]
    Type -->|Claim Bonus Failed| ClaimErr[ClaimedBonusFailed]
    
    GiftCodeErr --> MapError{Map Error Code}
    MapError -->|SB3019| Msg1[FreeSpinBonus.gift_code_error_message]
    MapError -->|SB3020| Msg2[FreeSpinBonus.Invalide_gift_code_error_message]
    MapError -->|SB3021| Msg3[FreeSpinBonus.Unexpected_gift_code_error_message]
    MapError -->|Other| Msg2
    
    Msg1 --> ShowRedemption[Show REDEMPTION_NOTICE Event]
    Msg2 --> ShowRedemption
    Msg3 --> ShowRedemption
    
    ClaimErr --> CheckCode{errorCode?}
    CheckCode -->|SB3023| ExpireEvent[EXPIRE_CLAIM_BONUS Event]
    CheckCode -->|Other| ErrorEvent[SHOW_NOTICE_ERROR Event]
    
    ExpireEvent --> UIQueue[Add to UI Event Queue]
    ErrorEvent --> UIQueue
    ShowRedemption --> UIQueue
    
    UIQueue --> Display[Display Error to User]
    Display --> End[End]
    
    style Start fill:#f44336,color:#fff
    style End fill:#4CAF50,color:#fff
    style Display fill:#FF9800,color:#000
```

---

## 10. COMPLETE DATA FLOW

```mermaid
graph TB
    subgraph External
        Server[Game Server]
        Notification[Notification Server]
    end
    
    subgraph Handlers Layer
        FSBHandlers[FSBPromotionHandlers<br/>- handlePromotion<br/>- handlePromotionTOProgress<br/>- handleClaimedAmount<br/>- handleRedeemResult<br/>- handleFinishPromotion<br/>- handleRedemptionNotice<br/>- handleClaimedBonusFailed]
        
        FSBUIHandler[FSBPromotionUIHandler<br/>- handlePromotionDisplay<br/>- openPromotionInfo<br/>- tryConsumeFSB<br/>- claimBonusWin<br/>- redeemGiftCode<br/>- updateTotalWin<br/>- openTurnOverRequired]
    end
    
    subgraph Store Layer
        PromotionStore[FSBPromotionStore<br/>- promotion<br/>- nextPromotion<br/>- finishPromotion<br/>- promotionTOProgress<br/>- redemptionNotice<br/>- claimedAmount<br/>- claimedBonusFailed<br/>- redeemStatus]
        
        UIStore[FSBPromotionUIStore<br/>- currentSpinCount<br/>- hasServerFinishPromotion<br/>- hasClaimedBonus<br/>- fsbConsumedThisRound<br/>- resumedFSBPromotion<br/>- pendingUIEvent<br/>- toProgress<br/>- promotionUrl]
    end
    
    subgraph Integration Layer
        CascadingSlot[Cascading Slot<br/>- SlotBetHandler<br/>- CascadingUIHandler<br/>- CascadingUIStore<br/>- BetControlStore]
    end
    
    subgraph UI Layer
        UIComponents[UI Components<br/>- FSB Promotion Dialog<br/>- FSB Web View<br/>- FSB Promotion Info<br/>- FSB Bottom Message<br/>- Gift Code Components]
    end
    
    Server -.->|7 Event Types| FSBHandlers
    Notification -.->|promotionProgress| FSBHandlers
    
    FSBHandlers --> PromotionStore
    FSBHandlers --> FSBUIHandler
    FSBUIHandler --> UIStore
    FSBUIHandler --> PromotionStore
    
    UIStore --> UIComponents
    
    CascadingSlot <--> FSBUIHandler
    CascadingSlot <--> UIStore
    
    FSBUIHandler -.->|Client Messages| Server
    
    style Server fill:#e1f5ff
    style Notification fill:#e1f5ff
    style FSBHandlers fill:#fff3cd
    style FSBUIHandler fill:#fff3cd
    style PromotionStore fill:#d4edda
    style UIStore fill:#d4edda
    style CascadingSlot fill:#f8d7da
    style UIComponents fill:#d1ecf1
```

---

## 11. KEY STORES & THEIR RESPONSIBILITIES

### FSBPromotionStore (Data Store)
- **Promotion Data**: `promotion`, `nextPromotion`, `finishPromotion`
- **TurnOver Data**: `promotionTOProgress`
- **Redemption**: `redemptionNotice`, `redeemStatus`
- **Claim Results**: `claimedAmount`, `claimedBonusFailed`
- **Methods**: `reset()`, `isRedeemSuccess`, `isClaimed`

### FSBPromotionUIStore (UI State Store)
- **Spin State**: `currentSpinCount`, `fsbConsumedThisRound`, `resumedFSBPromotion`
- **FSB State Machine**: `fsbState` (IDLE, READY, SPINNING, FINISHED, RESUMED)
- **Free Spin Tracking**: `isFreeSpinInGame`, `isUsedFSBPromotionBonus`
- **Server Flags**: `hasServerFinishPromotion`, `hasClaimedBonus`, `hasShowFinishPromotion`
- **UI Events**: `pendingUIEvent`, `event`
- **TurnOver**: `toProgress`, `pendingOpenTOAfterFinish`
- **Display State**: `activeTransitionEffect`, `skipGiftCode`, `activeDetailPromo`
- **Methods**: 
  - FSB Consumption: `tryConsumeFSB()`, `undoLastFSBSpin()`, `commitFSB()`
  - State Management: `reset()`, `markServerConfirmedEnd()`, `resetFinishPromotion()`
  - UI Events: `addPendingUIEvent()`, `removePendingUIEvent()`, `setEvent()`

---

## 12. INTEGRATION POINTS

### With Cascading Slot Module

1. **SlotBetHandler**
   - Checks `fsbPromotionUIStore.isFSBPromotionInProgress`
   - Uses FSB promotion bet settings (coinValue, betLevel)
   - Sets `changeUserBalance = true` for FSB bets
   - Calls `fsbPromotionUIHandler.tryConsumeFSB()` before spin

2. **CascadingUIHandler**
   - Handles `handleFreespinsJoinGame()` - sets `resumedFSBPromotion` if has promotionId
   - Manages free spin state coordination

3. **CascadingUIStore**
   - References `FSBPromotionUIStore` for state checks
   - Coordinates UI state with FSB promotion state

### With Shared Components Module

- **Audio**: FSB promotion audio file (`fsb-promotion.mp3`)
- **Common Components**: Node containers, notices, dialogs integrate with FSB UI components
- **Utility Functions**: `FunctionUtils.isPortraitMode()` is used in URL building

---

## 13. TYPICAL USER FLOWS

### Flow 1: Gift Code Redemption
```
User receives gift code
  → Opens game
  → Server sends Promotion (isGiftCode=true, isClaimed=false)
  → handlePromotion → handlePromotionDisplay
  → shouldShowGiftCode() = true
  → OPEN_GIFT_CODE event
  → User enters code
  → redeemGiftCode() → Server
  → Server response: RedeemResult / RedemptionNotice
  → Show success/error message
  → If success: OPEN_FREE_SPINS_PROMOTION
```

### Flow 2: FSB Promotion Play
```
User has active promotion
  → Server sends Promotion (isClaimed=true)
  → OPEN_PROMOTION_INFO event
  → User clicks Play/Spin
  → SlotBetHandler checks isFSBPromotionInProgress
  → tryConsumeFSB() → currentSpinCount--
  → BEGIN_USING_FBS event (first spin)
  → UPDATE_FSB_COUNT event
  → Spin executes with FSB settings
  → updateTotalWin() after result
  → UPDATE_TOTAL_WIN event
  → Repeat until currentSpinCount = 0
  → Server sends FinishPromotion
  → OPEN_PROMOTION_ENDED_POPUP
```

### Flow 3: TurnOver Requirement
```
User completes FSB spins
  → Server sends FinishPromotion (totalWin > 0)
  → Server sends PromotionTOProgress
  → OPEN_TURN_OVER_REQUIRED event
  → Notification listener active
  → User plays to complete turnover
  → Real-time updates via "promotionProgress" notification
  → UPDATE_TURN_OVER_REQUIRED events
  → User completes turnover
  → claimBonusWin() → Server
  → Server: ClaimedAmount
  → CLAIMED_BONUS_SUCCESS event
```

---

## NOTES

### Event Handler Registration
All server events are registered in `FSBPromotionHandlers.eventHandleList`:
- `GameServiceMessageSlot.Promotion.eventName`
- `GameServiceMessageSlot.PromotionTOProgress.eventName`
- `GameServiceMessageSlot.ClaimedAmount.eventName`
- `GameServiceMessageSlot.RedeemResult.eventName`
- `GameServiceMessageSlot.FinishPromotion.eventName`
- `GameServiceMessageSlot.RedemptionNotice.eventName`
- `GameServiceMessageSlot.ClaimedBonusFailed.eventName`

### State Management
- **MobX** is used for reactive state management (`mobx.makeAutoObservable`)
- **Dependency Injection** with Inversify (`@injectable`, `@inject`)
- **UI Events Queue** pattern: `pendingUIEvent` is consumed by UI components

### Trial Mode
- In trial mode, FSB promotion features are hidden
- `isTrialMode` flag controls visibility of gift code and promotion displays

---

**Created for**: Portrait Mahjong Wins Project  
**Last Updated**: 2025-11-19  
**Modules Covered**: 
- `shared-common-slot/fsb-promotion`
- `shared-cascading-slot` (integration points)
- `shared-components` (integration points)

