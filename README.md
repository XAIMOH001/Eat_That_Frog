# Time Weaver

Create a modern, full-stack Next.js single-page web application featuring a pure Neumorphism (Soft UI) design aesthetic. 

### Concept & Disguise:

The application is disguised as a professional "Personal Focus & Time-Audit Journal." To external viewers, it looks like a sleek daily time-blocking tool, but it includes integrated stealth metrics for personal habit consistency.

### Visual & Design System (Neumorphism / Soft UI):

1. Color Palette:

   - Background: Soft off-white/light grey background (#e0e5ec or #e6ecf5).

   - Base UI Elements: Matching background color with dual-directional soft shadows.

   - Raised Elements (Cards, Unpressed Buttons): Light top-left shadow (rgba(255, 255, 255, 0.8)), dark bottom-right shadow (rgba(163, 177, 198, 0.6)).

   - Sunken/Pressed Elements (Active Toggles, Input Fields, Logged Slots): Inset shadows to create an indented look.

   - Accent Colors: Soft Muted Indigo (#6C5CE7) for active states and Muted Teal (#00B894) for success badges.

2. Typography & Feel: Clean sans-serif (Inter or Geist), tactile, smooth transitions (200ms ease), pill-shaped and rounded rectangle containers (border-radius: 16px to 24px).

### Core Layout & Components:

1. Header & Quick Audit Bar:

   - Soft raised header displaying current date picker and a sleek "Daily Discipline Score" gauge.

   - A discrete toggle switch labeled "Core Routine Maintained" (Acts as the main habit tracker toggle, rendered in a sunken neumorphic toggle switch style).

2. Hourly Schedule Matrix (24-Hour Time Blocker):

   - A scrollable vertical timeline broken down hour by hour (00:00 - 23:00).

   - Each hour block includes:

     - Time stamp display.

     - Neumorphic text field to quickly write activity notes (e.g., "Deep Work - Coding", "Rest & Meals").

     - Category Select Pill (Options: Focus Time, Admin, Rest, Unproductive/Wasted Time).

     - Color-coded inset badge when categorized.

3. Analytics & Overview Dashboard (Collapsible / Tabbed View):

   - Neumorphic Stat Cards displaying:

     - Total Productive Hours vs. Wasted Hours (calculated automatically from the grid).

     - "Focus Consistency Streak" (displays continuous days where "Core Routine Maintained" was checked).

   - Soft neumorphic donut chart showing time distribution by category.

4. Data Privacy & Local Storage:

   - Ensure all inputs save automatically to browser localStorage so data remains 100% offline and private.

   - Include a "Export JSON Backup" button styled as a soft raised tactile button.

Build this using React, Next.js App Router, Tailwind CSS (with custom utility classes for neumorphic inset/drop shadows), and Lucide React icons.
Tips
Shadow Customization: If Lovable generates shadows that look too flat, ask it to: "Enhance the Tailwind box-shadow values to make the soft dual-light neumorphic extrusion more pronounced."

Mobile Responsiveness: Lovable defaults to desktop; remind it to stack the Hourly Grid and Analytics cards on mobile screens for easy access on your phone.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a62dfdda-1d31-4116-ad4c-6e2d3563a16a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
