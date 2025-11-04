# Design

## Visual Design Patterns

Behave follows a modern, clean design system with a focus on clarity and productivity. The application uses a warm, inviting color palette combined with structured layouts to create an efficient work environment.

### Color System

#### Primary Colors
- **Primary Yellow**: `hsl(36, 100%, 63%)` - Used for primary actions, CTAs, and important highlights
- **Light Background**: `hsl(44, 100%, 98%)` - Warm cream background for main content areas
- **Card Background**: `hsl(41, 100%, 95%)` - Slightly darker cream for card surfaces

#### Dark Mode Support
- Full dark mode implementation with inverted color schemes
- Dark background: `hsl(20, 14.3%, 4.1%)`
- Dark primary: `hsl(35, 100%, 60%)` - Adjusted yellow for dark backgrounds

#### Semantic Colors
- **Destructive/Error**: Red tones for errors and destructive actions
- **Secondary**: Muted grays for secondary information
- **Muted**: Light grays for disabled or de-emphasized content
- **Accent**: Subtle highlights for interactive elements

### Typography

- **Font Family**: Inter (variable font), falling back to system fonts
- **Font Sizes**: Using Tailwind's default scale (text-xs to text-3xl)
- **Font Weights**: 
  - Regular (400) for body text
  - Medium (500) for subtle emphasis
  - Semibold (600) for subheadings
  - Bold (700) for headings

### Layout Patterns

#### Container System
- Centered container with responsive padding
- Breakpoints: Default, md (768px), 2xl (1600px)
- Consistent padding: 1rem default, 2rem on medium+ screens

#### Card-Based Design
- Rounded corners (border-radius: 0.65rem standard, up to 1.5rem for larger elements)
- Subtle shadows for depth
- Nested card pattern: Cream outer container → White inner card
- Border styling: `border-[hsla(0, 0%, 0%, 0.12)]` for subtle definition

### Component Patterns

#### Buttons
- **Primary**: Yellow background with dark text, subtle border shadow
- **Secondary**: Gray background for secondary actions
- **Ghost**: Transparent with hover states
- **Destructive**: Red variants for dangerous actions
- **Icon Buttons**: Square aspect ratio with centered icons

#### Forms
- Input fields with consistent height (h-9)
- Focus states with ring outline
- Support for left icons in input fields
- Disabled states with reduced opacity

#### Cards & Panels
- Multi-layer card design for visual hierarchy
- Example structure:
  ```
  Outer: bg-[#fffdf5] border shadow-sm
  Inner: bg-white border-gray-200 hover:bg-gray-50
  ```
- Hover effects with smooth transitions (200ms duration)

#### Dialogs & Modals
- Dark overlay (bg-black/80)
- Centered positioning with smooth animations
- Zoom and fade effects for open/close transitions

### Interactive Patterns

#### Hover States
- Subtle background color changes
- Opacity transitions for action buttons (opacity-0 → opacity-100)
- Shadow elevation changes (shadow-sm → shadow-md)
- Color transitions with 200ms duration

#### Focus States
- Visible focus rings for accessibility
- Ring color matches primary theme color
- Consistent focus-visible outlines

#### Loading States
- Skeleton screens for content loading
- Disabled button states during async operations
- Smooth transitions between states

### Spacing System

- Based on Tailwind's spacing scale
- Common patterns:
  - `space-y-2` to `space-y-6` for vertical spacing
  - `gap-2` to `gap-4` for flex/grid gaps
  - `p-2` to `p-6` for padding
  - Consistent use of padding over margins

### Border & Shadow System

#### Borders
- Standard border: 1px solid with color variations
- Border colors tied to theme (border-border, border-input)
- Rounded corners using theme radius variables

#### Shadows
- Subtle shadows for cards and elevated elements
- Shadow progression: shadow-sm → shadow → shadow-md → shadow-lg
- Used sparingly to maintain clean aesthetic

### Responsive Design

- Mobile-first approach using Tailwind's responsive prefixes
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1600px)
- Fluid typography and spacing that adapts to screen size
- Collapsible sidebars and adaptive layouts for mobile

### Animation & Transitions

- Smooth color transitions (transition-colors)
- Duration: 200ms standard for most interactions
- Shadow transitions for hover effects (transition-all)
- Subtle animations for modals and dropdowns

### Design Philosophy

1. **Clarity First**: Clean, uncluttered interfaces that prioritize content
2. **Warm & Inviting**: Cream/yellow palette creates a friendly work environment
3. **Consistent Interactions**: Predictable hover, focus, and click behaviors
4. **Accessible**: Strong focus on keyboard navigation and screen reader support
5. **Progressive Disclosure**: Show complexity only when needed
6. **Visual Hierarchy**: Clear distinction between primary, secondary, and tertiary actions

