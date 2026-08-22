# Eat That Frog — Complete Product & Implementation Context

## 0. PRIMARY INSTRUCTION TO CLAUDE CODE

You are extending an existing Next.js application called **Eat That Frog**.

The current application is already functional and has an established visual language and dashboard UI.

**DO NOT redesign, replace, restyle, simplify, or restructure the existing journal/dashboard UI unless explicitly required by the features below.**

The screenshots supplied with this task represent the current production direction and must be treated as the visual source of truth for the existing dashboard.

The new work should be added around the current product:

- public landing page
- authentication
- onboarding
- user profile/avatar
- private Battle/Commitment system
- privacy controls
- badges/milestones
- public/private data boundaries
- multi-user architecture

The existing dashboard must continue to look and feel like the current screenshots.

The application should feel like **one coherent product**, not like a new app was inserted into the existing one.

---

# 1. PRODUCT IDENTITY

## Product name

**Eat That Frog**

## Core idea

Eat That Frog is a personal discipline and execution system based on the idea of identifying and completing the hardest, most important task of the day before allowing low-value work to dominate the day.

The product is NOT intended to be another generic to-do list.

Its philosophy is:

> Do the important thing first.  
> Control what gets in your way.  
> Review how you actually spent your time.  
> Become more consistent.

The product has two connected pillars:

### A. EXECUTE

The existing productivity system:

- A1 Frog
- A2/A3/B/C tasks
- hourly schedule
- deep work
- time leaks
- core routine
- daily discipline score
- historical calendar
- analytics
- streaks

### B. CONTROL

A new private self-control/commitment system:

- user chooses one personal Battle/Commitment
- Battle is private by default
- user makes a commitment related to that behavior
- user checks in once per valid cycle
- commitment streak is calculated server-side
- best streak and personal milestones are preserved
- Battle category is never exposed publicly by default
- user must explicitly re-authenticate to reveal/change the private Battle

The product should NOT position itself specifically as a masturbation tracker.

Instead it supports many possible personal battles/behaviors.

Examples:

- Social media
- Pornography
- Masturbation
- Gaming
- Doomscrolling
- Junk food
- Smoking
- Procrastination
- Custom behavior

Use neutral language such as:

**Battle**, **Commitment**, **Discipline**, **Control**, and **Consistency**.

Avoid diagnosing the user as having an "addiction."

---

# 2. CURRENT UI IS THE VISUAL SOURCE OF TRUTH

The existing screenshots show the current dashboard.

The current visual system includes:

- very light blue/gray background
- neumorphic cards
- soft inset/outset shadows
- rounded containers
- subtle borders
- muted blue/gray typography
- purple/indigo accent for primary actions
- green for success/progress
- reddish/brown accents for leaks/problems
- compact modern typography
- restrained icons
- dense but clean dashboard layout
- calm analytical aesthetic

Do not replace the neumorphic design.

Do not introduce:

- glassmorphism
- gradients everywhere
- large colorful illustrations
- neon gaming UI
- aggressive "NoFap" aesthetics
- generic SaaS dashboard templates
- a completely new typography system

New screens should reuse the same:

- spacing scale
- border radius style
- shadows
- typography hierarchy
- colors
- icon treatment
- button treatment
- card treatment

The landing page and authentication screens can breathe more than the dashboard, but they must still look like the same product.

---

# 3. CURRENT DASHBOARD — DO NOT BREAK THIS

The current dashboard contains approximately:

## Header

- Eat That Frog / Personal Focus & Time Audit branding
- current date
- previous/next date navigation
- date selector
- Daily Discipline circular score
- Core Routine status/toggle

## Quote card

A motivational quote area.

## Frog card

Title:

**EAT THAT FROG**

Description:

> The hardest, most important thing you will do today.

Input:

> What is your frog today?

Button:

> Ate The Frog!

## Navigation

- Journal
- Analytics
- Clear Log

## Hourly Schedule

24-hour schedule with entries categorized approximately as:

- Focus
- Admin
- Rest
- Leaks

## Today's Plan

- Frog
- A2/A3/B/C tasks
- estimated hours
- "plan for tomorrow"

## Day Overview

- Productive
- Rest
- Leaks
- Unlogged

## Focus Consistency Streak

Current streak.

## Monthly calendar

Shows:

- Held
- Missed
- Upcoming

## Analytics

Current analytics include:

- Productive Hours
- Time Leaks
- Focus Consistency Streak
- Best Streak
- Frog Execution Rate
- Last 7 Days
- Time Distribution
- Focus Time
- Admin
- Rest
- Time Leaks

These concepts remain.

---

# 4. NEW SITE ARCHITECTURE

Use the existing App Router.

Recommended route structure:

```text
app/
├── (marketing)/
│   ├── page.tsx
│   └── features/
│
├── (auth)/
│   ├── sign-in/
│   │   └── page.tsx
│   ├── sign-up/
│   │   └── page.tsx
│   └── onboarding/
│       ├── page.tsx
│       └── battle/
│
├── (dashboard)/
│   ├── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   ├── achievements/
│   │   └── page.tsx
│   └── settings/
│       ├── page.tsx
│       └── privacy/
│
└── api/
```

The exact grouping can follow the existing project structure if different.

---

# 5. PUBLIC LANDING PAGE

Create a polished public landing page for logged-out/new users.

Purpose:

- explain what Eat That Frog is
- communicate the product philosophy
- show the existing product visually
- explain differentiators
- allow Get Started / Login
- communicate privacy
- establish trust

Do NOT make it feel like a generic productivity startup landing page.

It should feel like the front door to the existing dashboard.

## Hero

Primary headline:

> **Do the work that matters.**

Supporting text:

> Eat That Frog is a personal discipline system built to help you identify your hardest task, protect your focus, control distractions, and build consistency one day at a time.

Primary CTA:

**Get Started**

Secondary CTA:

**Log In**

Include a visual preview of the existing dashboard.

The existing dashboard screenshot can be used as the main product visual.

Do not create a radically different UI mockup.

## Hero supporting message

Something conceptually like:

> One important task.  
> One focused day.  
> One honest review.

Keep the copy concise.

---

# 6. LANDING PAGE FEATURE SECTIONS

Create sections explaining the existing and new features.

## Section: Eat Your Frog

Explain:

- identify the highest-impact task
- force prioritization
- avoid low-value task farming
- completion matters more than task volume

## Section: Plan Your Day

Explain:

- hourly time blocking
- planned vs actual time
- categories
- deep work
- time leaks

## Section: Build Discipline

Explain:

- daily Discipline Score
- core routine
- execution consistency
- personal milestones
- streaks

## Section: Fight What Gets In Your Way

Introduce the new Battle/Commitment system.

Important wording:

> Choose one personal behavior you want to gain more control over.

Do NOT make the landing page assume the user is fighting masturbation.

Examples can be shown:

- social media
- gaming
- pornography
- doomscrolling
- procrastination
- other personal behaviors

Clarify:

> Your Battle is private by default.

## Section: Privacy

This is an important product differentiator.

Communicate:

> Your private Battle is never displayed on your public profile, leaderboard, or accountability group unless you explicitly choose to share it.

Also mention that the app displays the resulting discipline/streak information rather than exposing the sensitive behavior.

## Section: Personal Progress

Explain:

- streaks
- achievements
- best records
- recovery after a missed day
- monthly history
- analytics

---

# 7. LANDING PAGE FINAL CTA

End with:

> **Stop planning around the work. Start doing it.**

Button:

**Get Started**

Secondary:

**Log In**

Footer:

- Eat That Frog
- Privacy
- Terms
- Sign In
- Create Account

---

# 8. AUTHENTICATION

The application currently has a `requireUser()` seam intended for future authentication.

Integrate the chosen authentication provider while preserving this architecture.

The implementation should support multi-tenancy.

Every user-owned record must be scoped by authenticated `user_id`.

Never trust a user ID supplied by the client.

The authenticated identity must come from the server-side session.

## Sign In page

Use the same visual language as the dashboard.

Centered neumorphic authentication card.

Brand:

> Eat That Frog

Headline:

> Welcome back.

Options should support the chosen authentication implementation.

Prefer:

- Google
- GitHub

If credentials are implemented, include them cleanly.

Also provide:

> Don't have an account? Get started.

Do not make the authentication page visually noisy.

---

# 9. SIGN-UP / FIRST-TIME EXPERIENCE

After successful first login, do not immediately throw the user into an empty dashboard.

Use a lightweight onboarding flow.

The goal is to configure the user's first experience while keeping onboarding short.

Recommended sequence:

```text
Account
   ↓
Welcome
   ↓
Choose Battle
   ↓
Privacy confirmation
   ↓
First Frog
   ↓
Dashboard
```

---

# 10. ONBOARDING WELCOME

Headline:

> **Welcome to Eat That Frog.**

Copy:

> This isn't another list of things to check off.
>
> Pick the work that matters most, protect your time, and build the discipline to follow through.

CTA:

**Set Up My Day**

---

# 11. PRIVATE BATTLE ONBOARDING

Screen:

> **Choose Your Battle**

Supporting text:

> Everyone has something that repeatedly steals attention, time, or control.
>
> Choose one behavior you want to work on.

Privacy warning:

> 🔒 **Private by default**
>
> Your Battle will not appear on your public profile, accountability pod, leaderboard, analytics sharing, or public achievements.

Options:

```text
Social Media
Pornography
Masturbation
Gaming
Doomscrolling
Junk Food
Smoking
Procrastination
Other
```

If "Other":

provide a generic private custom input.

Do not require unnecessary details.

Store the Battle as private user data.

---

# 12. IMPORTANT BATTLE PRIVACY MODEL

The Battle must be treated as sensitive private data.

The normal application should refer to it generically as:

**Commitment**

or:

**Private Commitment**

Do NOT constantly display:

> Masturbation
> Pornography
> Social Media

on the dashboard.

Example dashboard:

```text
PRIVATE COMMITMENT

🔥 12 day streak

Today's commitment
Kept

Next check-in
Tomorrow
```

Not:

```text
NO MASTURBATION
🔥 12 DAYS
```

The user knows what the commitment represents because they chose it, but the UI does not repeatedly expose it.

---

# 13. BATTLE ACCESS MUST REQUIRE RE-AUTHENTICATION

This is a critical privacy requirement.

A person who finds the user's unlocked phone/laptop should not be able to casually open Settings and discover the user's Battle.

Therefore:

Normal Settings page:

```text
Privacy
   Private Commitment  🔒
```

Do not display the category.

When clicked:

Require re-authentication.

Preferred mechanisms:

- WebAuthn/passkey/platform authentication where supported
- otherwise account password/session reauthentication

Only after successful reauthentication may the user access:

```text
PRIVATE COMMITMENT

Current Battle
[private value]

Current streak
18 days

Best streak
31 days

[Change Battle]
[Pause Commitment]
[End Commitment]
```

After leaving this section, the sensitive value must not remain visible elsewhere.

---

# 14. CHANGE BATTLE

Changing a Battle must also require re-authentication.

Do not allow casual changes.

Show:

> **Change your Battle?**

Explain:

> Changing your Battle ends the current commitment and starts a new one. Your historical streak and achievements are preserved in your personal history.

Show current streak:

> Current streak: 18 days

Buttons:

**Keep Current**

**Change Battle**

Changing the Battle should NOT erase historical milestones.

The old streak becomes historical.

The new Battle starts a new commitment.

---

# 15. PRIVATE DATA SHOULD NOT LEAK THROUGH THE UI

Never expose the Battle name in:

- dashboard titles
- public URLs
- notifications
- emails
- browser document titles
- public profile APIs
- public leaderboards
- accountability pod summaries
- achievement names
- social sharing
- analytics sharing
- page metadata

Use generic terms:

- Commitment
- Discipline
- Streak
- Personal Record

Example notification:

GOOD:

> Your 18-day commitment streak continues.

BAD:

> Your 18-day masturbation streak continues.

---

# 16. USER PROFILE

Add a user profile accessible from the avatar in the top navigation.

The profile should be public-safe by default.

## Avatar

The existing dashboard already has room for an avatar/user menu.

Use:

- user avatar/photo where available
- initials fallback

Clicking avatar opens a compact neumorphic menu:

```text
Profile
Achievements
Settings
Privacy
Theme
Sign Out
```

Do not make this menu large.

## Public-safe profile page

Show:

- avatar
- display name
- member since
- Discipline Score
- current commitment streak
- best streak
- achievements
- Frog execution statistics
- deep-work statistics
- personal milestones

Do NOT show the Battle category.

Example:

```text
Alex

Discipline Score
87

Current Commitment Streak
18 days

Best Streak
31 days

Frog Execution
92%

Achievements
[icons]

Personal Records
...
```

---

# 17. PRIVATE PROFILE INFORMATION

Profile settings should separate:

## Public profile

- avatar
- display name
- optional bio
- achievement visibility
- statistics visibility

## Private data

- Battle
- commitment category
- custom Battle text
- private notes
- private commitment history

The Battle remains private by default.

---

# 18. AVATAR / USER MENU

The avatar should be added to the existing dashboard without disrupting the current header layout.

Use the current header's available space.

Recommended:

```text
[avatar]
```

Click:

```text
Profile
Achievements
Settings
────────────
Theme
Sign Out
```

Do not redesign the entire header.

---

# 19. DISCIPLINE SCORE

Keep the existing Discipline Score concept.

Do not replace it with a generic XP system.

Recommended conceptual weighting:

```text
A1 Frog execution          50%
Deep work                  25%
Core routine               15%
Private commitment         10%
```

The exact scoring formula may be tuned later.

Important rules:

- score calculated server-side
- client cannot set score
- no points based purely on number of tasks
- low-priority task volume cannot overpower A1 execution
- commitment contributes to discipline but does not dominate it

The app should reward quality over quantity.

---

# 20. ANTI-GAMING RULES

The purpose is not to prove whether a user is telling the truth about their private behavior.

The application cannot know that.

Instead, make cheating mechanically unrewarding.

Never do:

```text
click button → client adds score
```

Instead:

```text
user action
→ server validates
→ server creates event
→ score derived from events
```

Use server timestamps.

Validate authenticated user identity.

Prevent duplicate submissions.

Use unique constraints where appropriate.

Prevent arbitrary date manipulation.

Prevent client-controlled score values.

---

# 21. PRIVATE COMMITMENT CHECK-IN

The new commitment system should operate as an event system.

Conceptually:

```text
COMMITMENT_STARTED
COMMITMENT_CHECKED_IN
COMMITMENT_BROKEN
COMMITMENT_PAUSED
COMMITMENT_CHANGED
```

The user sees a simple UI.

Example:

```text
PRIVATE COMMITMENT

🔥 12 DAYS

[ I KEPT MY COMMITMENT ]

Next check-in:
Tomorrow

The button becomes unavailable after successful check-in.
```

The frontend should show a disabled/red/locked state, but the server is the authority.

---

# 22. CHECK-IN WINDOW

The original concept uses approximately an 18-hour lock.

Keep that concept unless there is a strong technical reason to modify it.

The UI might communicate:

> Checked in.
> Next check-in available tomorrow.

The server must enforce the actual allowable timestamp.

Never trust the user's device clock.

Do not let the client decide whether the button should become available.

---

# 23. MISSED DAY / BROKEN STREAK

Do not destroy the user's historical achievements.

Example:

```text
Current streak
0 days

Best streak
46 days

Commitment rate
95%

Recovery
1 day
```

A broken streak should become a recovery opportunity rather than making the user feel that all progress disappeared.

Possible achievement:

**Comeback**

> Start a new streak after breaking a previous one.

---

# 24. BADGES AND MILESTONES

Badges should be personal achievements, not monetary rewards.

Categories:

## Frog

- First Bite
- Frog Slayer
- Deep Worker

## Discipline

- Iron Discipline
- Unbreakable

## Commitment

- First Commitment
- 7 Days
- 30 Days
- 100 Days
- Comeback

## Mastery

Potential combined milestones:

- Two Fronts
- Frog & Fire
- Controlled

Do not expose the sensitive Battle category inside badge names.

Example:

GOOD:

**7-Day Commitment**

BAD:

**7-Day No Masturbation**

---

# 25. ACHIEVEMENT PAGE

Create a dedicated achievements page using the same card/neumorphic style.

Sections:

```text
Earned
In Progress
Locked
```

Each badge:

- icon
- name
- short description
- earned date/progress

Never reveal the Battle through badge descriptions.

---

# 26. DATABASE EXTENSIONS

The existing schema should remain compatible.

Existing:

```text
daily_records
planned_tasks
hourly_logs
user_achievements
```

Add the minimum required structures.

Conceptually:

```text
user_profiles
---------------
user_id
display_name
avatar_url
created_at
updated_at
```

```text
private_commitments
-------------------
id
user_id
category
custom_label
status
started_at
ended_at
created_at
updated_at
```

```text
commitment_events
-----------------
id
user_id
commitment_id
type
occurred_at
metadata
created_at
```

```text
discipline_events
-----------------
id
user_id
type
source_id
occurred_at
metadata
created_at
```

Do not store duplicated mutable scores as the primary source of truth when they can be derived from events.

Use database constraints for:

- user ownership
- uniqueness
- duplicate check-in prevention
- valid commitment references

---

# 27. MULTI-TENANT SECURITY

Every user-owned table/query must be scoped to the authenticated user.

Never perform:

```text
SELECT * FROM daily_records WHERE id = ...
```

without verifying ownership.

Use:

```text
WHERE id = ... AND user_id = authenticatedUserId
```

The same principle applies to:

- tasks
- hourly logs
- achievements
- profile
- commitments
- commitment events
- analytics
- score calculations

Never accept `user_id` as trusted client input.

Derive it from the authenticated session.

---

# 28. PUBLIC VS PRIVATE API DATA

Create a deliberate data boundary.

Public-safe:

```text
displayName
avatar
publicStats
achievements
streak
selected statistics
```

Private:

```text
Battle category
custom Battle
private notes
private commitment history details
sensitive analytics
```

The public APIs should never accidentally serialize the private commitment object.

Do not solve this only with frontend hiding.

The server response itself should exclude sensitive fields.

---

# 29. ACCOUNTABILITY PODS

The current project concept includes private accountability groups.

Preserve that direction, but keep Battle private.

Pod members can see:

```text
Alex
86 Discipline
18-day Commitment Streak
Frog Execution 92%
3 achievements
```

They cannot see:

```text
Battle: Masturbation
```

unless Alex explicitly changes a privacy setting to share it.

---

# 30. PUBLIC LEADERBOARDS

Do not create a global leaderboard for raw points.

Prefer personal records and small accountability groups.

The philosophy is:

> compete against your past self first.

If leaderboard-like comparison is added later, use limited normalized metrics such as:

- discipline consistency
- Frog execution rate
- streak milestones

Avoid pure total-point ranking.

---

# 31. DASHBOARD UPDATE

The dashboard must remain visually almost identical to the existing dashboard.

Only add what is necessary.

Recommended addition:

A compact **Commitment** card placed alongside the existing discipline/routine context without displacing the Frog.

Example concept:

```text
PRIVATE COMMITMENT

🔥 12 days

Today's check-in
Kept

Next check-in
Tomorrow
```

Do not show the Battle category.

The Frog must remain the dominant primary action.

---

# 32. DASHBOARD PRIORITY ORDER

The user's attention hierarchy should be:

1. Daily Discipline
2. A1 Frog
3. Core Routine
4. Hourly execution / Today's Plan
5. Private Commitment
6. Analytics / historical data

Do not let the Commitment feature visually overpower the Frog.

Eat That Frog is the primary product.

---

# 33. ANALYTICS UPDATE

Extend existing analytics with generic commitment metrics.

Add:

- Current Commitment Streak
- Best Commitment Streak
- Commitment Rate
- Recovery Count

Do NOT reveal the Battle category.

Possible card:

```text
COMMITMENT CONSISTENCY

18 days

Current streak

95%

30-day consistency
```

---

# 34. PROFILE SETTINGS

Add settings sections:

## Account

- display name
- email
- avatar
- authentication provider

## Appearance

- theme
- existing theme functionality

## Privacy

- profile visibility
- stats visibility
- achievement visibility
- private commitment access

## Private Commitment

This is locked behind re-authentication.

## Account

- sign out
- delete account

---

# 35. FIRST LOGIN UX

First login should create a guided experience.

Suggested:

```text
Welcome
   ↓
Choose Battle
   ↓
Privacy confirmation
   ↓
Choose today's Frog
   ↓
Open Journal
```

Do not force users through a long questionnaire.

The app should get them to the dashboard quickly.

---

# 36. RETURNING USER UX

Returning authenticated users should go directly to the existing dashboard.

Do not show onboarding again.

If profile setup is incomplete, use small unobtrusive prompts rather than blocking the journal.

---

# 37. LOGGED-OUT ROUTE PROTECTION

Protected dashboard routes should require authentication.

Unauthenticated user visiting dashboard:

```text
redirect → /sign-in
```

Authenticated user visiting the marketing homepage:

Either allow viewing it or redirect to dashboard, depending on final UX preference.

Recommended:

- `/` is public landing page
- authenticated users can still access `/`
- dashboard available at `/dashboard` or current protected route
- successful login redirects to dashboard

---

# 38. MOBILE RESPONSIVENESS

Do not redesign the desktop dashboard.

However, new screens must be responsive.

Landing:

- mobile hero
- stacked CTA buttons
- feature cards stack vertically

Auth:

- centered card with good mobile spacing

Profile:

- responsive card layout

Private Battle screen:

- mobile friendly
- sensitive data remains hidden until re-authentication

---

# 39. ACCESSIBILITY

Use:

- semantic buttons
- labels
- accessible dialogs
- keyboard navigation
- visible focus states
- adequate contrast
- screen-reader labels for icons
- confirmation before destructive actions

Never rely solely on color to communicate:

- held
- missed
- active
- locked

---

# 40. SECURITY CONSIDERATIONS

Implement sensible security practices:

- server-side authorization
- secure session handling
- CSRF-safe authentication actions
- rate limiting where appropriate
- reauthentication for sensitive operations
- no sensitive data in public responses
- no sensitive data in URLs
- no sensitive data in page titles
- server-side timestamps
- duplicate action protection
- ownership checks on all mutations

If sensitive Battle text is stored, evaluate application/database encryption options rather than treating it as ordinary public profile text.

---

# 41. IMPORTANT PRIVACY UX PRINCIPLE

The user should be able to use the application every day without the Battle being visibly exposed.

Normal dashboard:

> Commitment  
> 🔥 18 days

Normal analytics:

> Commitment Consistency  
> 95%

Public profile:

> Commitment Streak  
> 18 days

Private settings after re-auth:

> Battle: [actual private value]

This is the correct privacy model.

---

# 42. WHAT NOT TO DO

Do NOT:

- redesign the existing journal dashboard
- rename the Frog system
- remove the existing hourly schedule
- replace the current neumorphic styling
- create a generic Todoist clone
- make the app primarily about abstinence
- show a user's Battle publicly
- show Battle names in notifications
- put Battle names in URLs
- expose Battle data in public APIs
- allow client-side score manipulation
- allow users to repeatedly check in for infinite points
- create a global XP leaderboard
- make low-value task quantity more important than A1 execution
- destroy historical achievements when a streak breaks

---

# 43. PRODUCT LANGUAGE

Preferred:

- Frog
- A1
- Discipline
- Commitment
- Battle
- Control
- Consistency
- Deep Work
- Time Leaks
- Core Routine
- Personal Record
- Achievement
- Recovery

Avoid overusing:

- addiction
- failure
- punishment
- relapse
- shame
- nofap

The product should feel disciplined, calm, private, and empowering.

---

# 44. FINAL PRODUCT STORY

The complete product should communicate this:

> **Eat That Frog helps you control your day instead of letting your day control you.**
>
> Choose the work that matters.
>
> Protect time for it.
>
> Track where your hours actually go.
>
> Build consistency.
>
> And privately work on the habits or behaviors that get in your way.

The Battle system is a supporting mechanism for discipline, not the identity of the product.

---

# 45. IMPLEMENTATION PHASES

Build in this order.

## Phase 1 — Preserve existing product

Verify that the existing:

- journal
- Frog
- tasks
- hourly schedule
- analytics
- calendar
- routine lock
- scoring

continue to work exactly as they currently do.

## Phase 2 — Authentication

Implement:

- sign in
- sign up / first-time login
- session
- protected dashboard
- server-side user identity

## Phase 3 — Public marketing

Implement:

- landing page
- feature sections
- product preview
- Get Started
- Log In
- privacy messaging

## Phase 4 — Profile

Implement:

- avatar
- display name
- user menu
- profile page
- settings

## Phase 5 — Private Commitment

Implement:

- onboarding Battle selection
- private commitment model
- check-in
- streak
- best streak
- server-side validation
- 18-hour/next-cycle restriction
- recovery behavior

## Phase 6 — Privacy protection

Implement:

- Battle hidden from normal dashboard
- Battle hidden from public profile
- Battle hidden from pod
- Battle hidden from notifications
- Battle hidden from URLs
- reauthentication for viewing/changing Battle

## Phase 7 — Gamification

Implement:

- badges
- milestones
- personal records
- commitment milestones
- combined discipline achievements

## Phase 8 — Final polish

Verify:

- mobile
- accessibility
- authorization
- API boundaries
- duplicate action handling
- optimistic UI
- error handling
- loading states
- empty states
- privacy leaks

---

# 46. ACCEPTANCE CRITERIA

The implementation is considered successful only when all of the following are true:

### Existing product

- current dashboard remains visually consistent
- Frog workflow still works
- hourly schedule still works
- tasks still work
- analytics still work
- historical navigation still works
- core routine still works

### Authentication

- user can sign in
- authenticated data is isolated per user
- unauthenticated dashboard access is protected
- avatar/profile works

### Landing

- first-time visitors understand the product
- Get Started works
- Log In works
- feature explanations exist
- privacy is clearly communicated

### Commitment

- user chooses one Battle
- Battle is private
- commitment can be checked in
- duplicate check-ins are rejected
- server controls timing
- streak is calculated server-side
- best streak is preserved
- missed streak does not erase history

### Privacy

- Battle is not visible on dashboard
- Battle is not visible on public profile
- Battle is not exposed through pod data
- Battle is not included in notifications
- Battle is not exposed in URLs
- Battle can only be revealed/changed through deliberate reauthentication
- public APIs do not serialize Battle fields

### Gamification

- A1 remains the most valuable action
- task quantity cannot be exploited for large score gains
- achievements are earned from server-side events
- commitment contributes to Discipline Score but does not dominate it
- personal milestones are preserved

---

# 47. DESIGN PRINCIPLE TO KEEP THROUGHOUT THE IMPLEMENTATION

The application should always answer this question:

> **Does this feature help the user become more capable of doing what they said they would do?**

If yes, build it.

If it only creates more checkmarks, points, notifications, or vanity metrics, do not add it.

The product should feel like a calm personal discipline instrument rather than a noisy gamified task manager.

---

# 48. FINAL DIRECTIVE

Build the new functionality **around the existing Eat That Frog application**.

Do not replace the current dashboard.

Do not redesign its core UI.

Do not turn it into a dedicated abstinence tracker.

Add:

1. public landing page
2. authentication
3. onboarding
4. user profile/avatar
5. private Battle/Commitment system
6. secure Battle privacy
7. personal achievements
8. streak and milestone infrastructure
9. server-side anti-cheat/event validation
10. multi-tenant user isolation

The finished product should feel like the current application evolved naturally from a personal local productivity journal into a polished public **personal discipline system**.

The central product loop is:

**Choose the Frog → Plan → Execute → Control distractions → Review → Build consistency → Repeat.**
