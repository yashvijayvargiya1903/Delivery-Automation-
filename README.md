# Delivery Automation

Premium mobile-first control center for multi-platform delivery automation.

## Exclusive Order Lock

The core workflow is designed around one active delivery at a time:

1. **All connected platforms stay live** while no delivery is active.
2. When an eligible offer is accepted from one platform (for example, Porter), the automation engine creates an **exclusive lock**.
3. Other connected platforms are paused so new overlapping orders are not accepted.
4. The active delivery keeps its lock until its estimated completion window.
5. **At 2 minutes before the estimated completion time**, connected platforms reopen.
6. The engine compares eligible offers using the user's rules — payout, pickup distance, ETA, preferred area and other scoring factors.
7. The highest-scoring eligible offer can be accepted automatically, with a rider popup/push notification.
8. If an active order is cancelled, the system immediately unlocks all platforms, alerts the rider, searches available offers and attempts to auto-accept the best eligible one. The lock moves to the newly accepted order and the cycle repeats.

The current GitHub Pages demo includes simulated incoming-order, cancellation, automatic lock/reopen, best-offer selection and rider notification flows. Demo controls simulate provider events; they do not control real delivery apps.

## Production architecture

The frontend should remain provider-agnostic:

- **Provider adapters:** Porter, Swiggy, Zomato, Rapido, etc.
- **Offer event stream:** normalize every incoming offer into one common schema.
- **Decision engine:** eligibility rules + weighted scoring.
- **Exclusive lock service:** one active order per driver/account.
- **Release scheduler:** calculates activeOrder.estimatedCompletionAt minus 2 minutes.
- **Action layer:** accepts/rejects/pauses only through provider-supported integrations.
- **Audit log:** every offer, decision, lock and release event is persisted.
- **Supabase/PostgreSQL:** user settings, provider connections, rules and event history.
- **Mobile app:** React Native/Expo can reuse the same API and decision engine.

### Important integration constraint

The demo uses simulated platform states. A normal web page cannot reliably switch other third-party mobile apps on/off or accept orders inside them.

For production, each delivery provider needs a supported API/SDK, partner integration, or another permitted OS-level mechanism. If a provider does not expose the required control, the app should fall back to notifications/manual confirmation rather than pretending the integration is active.

## Demo

- Automation engine
- Smart Auto Accept
- Exclusive Order Lock
- 2-minute release window
- Multi-platform status
- Orders and decision log
- Analytics
- Mobile-first/PWA-ready interface