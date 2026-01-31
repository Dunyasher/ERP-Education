# 🎨 Animations Guide

This guide explains how to use the animation system in the application.

## Overview

The application uses **Framer Motion** for smooth, performant animations. Animations are organized into reusable components and utilities.

## Quick Start

### 1. Import Animation Components

```jsx
import { FadeIn, ScaleIn, SlideInFromBottom } from '@/components/animations';
import { AnimatedCard } from '@/components/animations/AnimatedCard';
```

### 2. Use Animation Components

```jsx
// Fade in animation
<FadeIn delay={0.2}>
  <div>Your content here</div>
</FadeIn>

// Scale in with hover
<ScaleInHover>
  <Card>Hover me!</Card>
</ScaleInHover>

// Animated card
<AnimatedCard delay={0.1}>
  <ProductCard />
</AnimatedCard>
```

## Available Animation Components

### Page Transitions

Automatically applied to route changes in `RootLayout.jsx`:

```jsx
// Already implemented - no code needed!
// Pages automatically fade and slide when navigating
```

### FadeIn Components

```jsx
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/animations';

// Simple fade in
<FadeIn delay={0.2}>
  <div>Content</div>
</FadeIn>

// Staggered fade in (for lists)
<FadeInStagger>
  <FadeInItem>
    <div>Item 1</div>
  </FadeInItem>
  <FadeInItem>
    <div>Item 2</div>
  </FadeInItem>
</FadeInStagger>
```

### ScaleIn Components

```jsx
import { ScaleIn, ScaleInHover } from '@/components/animations';

// Scale in on mount
<ScaleIn delay={0.1}>
  <Button>Click me</Button>
</ScaleIn>

// Scale in + hover effect
<ScaleInHover>
  <Card>Hover to scale</Card>
</ScaleInHover>
```

### SlideIn Components

```jsx
import { 
  SlideInFromLeft, 
  SlideInFromRight, 
  SlideInFromBottom,
  SlideInFromTop 
} from '@/components/animations';

<SlideInFromLeft delay={0.2}>
  <div>Slides from left</div>
</SlideInFromLeft>

<SlideInFromBottom delay={0.3}>
  <div>Slides from bottom</div>
</SlideInFromBottom>
```

### AnimatedCard

Perfect for product cards, feature cards, etc.:

```jsx
import { AnimatedCard, AnimatedCardHover } from '@/components/animations/AnimatedCard';

<AnimatedCard delay={0.1}>
  <ProductCard product={product} />
</AnimatedCard>

<AnimatedCardHover>
  <FeatureCard />
</AnimatedCardHover>
```

## Using Framer Motion Directly

For custom animations, use Framer Motion directly:

```jsx
import { motion } from 'framer-motion';
import { fadeIn, slideUp, staggerContainer } from '@/utils/animations';

// Simple animation
<motion.div
  initial="hidden"
  animate="visible"
  variants={fadeIn}
>
  Content
</motion.div>

// Staggered list
<motion.div variants={staggerContainer} initial="hidden" animate="visible">
  {items.map((item, i) => (
    <motion.div key={i} variants={staggerItem}>
      {item}
    </motion.div>
  ))}
</motion.div>

// With hover
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Interactive element
</motion.div>
```

## CSS Animation Classes

For simple CSS-only animations (no JavaScript needed):

```jsx
<div className="animate-fade-in-up animate-delay-200">
  Content
</div>

<div className="hover-lift">
  Card with lift effect
</div>

<div className="hover-scale">
  Element that scales on hover
</div>
```

Available CSS classes:
- `animate-fade-in-up`
- `animate-fade-in-down`
- `animate-fade-in-left`
- `animate-fade-in-right`
- `animate-scale-in`
- `animate-slide-up`
- `animate-slide-down`
- `animate-delay-100` through `animate-delay-500`
- `hover-lift`
- `hover-scale`
- `hover-glow`

## Animation Presets

Located in `client/src/utils/animations.js`:

```jsx
import { 
  fadeIn, 
  slideUp, 
  slideDown, 
  scaleIn,
  staggerContainer,
  staggerItem,
  hoverScale,
  hoverLift,
  tapScale,
  smoothTransition,
  quickTransition
} from '@/utils/animations';
```

## Best Practices

### 1. Performance
- Use CSS animations for simple effects (hover, transitions)
- Use Framer Motion for complex animations and page transitions
- Avoid animating too many elements at once

### 2. Accessibility
- Animations respect `prefers-reduced-motion`
- Keep animations subtle and purposeful
- Don't rely solely on animations to convey information

### 3. Timing
- Page transitions: 0.3-0.4s
- Component animations: 0.4-0.5s
- Hover effects: 0.2s
- Stagger delays: 0.1s between items

### 4. Easing
- Use the provided easing: `[0.22, 1, 0.36, 1]` (smooth, natural)
- Avoid linear animations for UI elements

## Examples

### Product Grid with Staggered Animation

```jsx
import { FadeInStagger, FadeInItem } from '@/components/animations';

<FadeInStagger>
  {products.map((product) => (
    <FadeInItem key={product.id}>
      <ProductCard product={product} />
    </FadeInItem>
  ))}
</FadeInStagger>
```

### Modal with Scale Animation

```jsx
import { ScaleIn } from '@/components/animations';

<Dialog>
  <DialogContent>
    <ScaleIn>
      <div>Modal content</div>
    </ScaleIn>
  </DialogContent>
</Dialog>
```

### Button with Hover Animation

```jsx
import { motion } from 'framer-motion';
import { hoverScale, tapScale } from '@/utils/animations';

<motion.button
  whileHover={hoverScale}
  whileTap={tapScale}
  className="px-4 py-2 bg-black text-white rounded"
>
  Click me
</motion.button>
```

## File Structure

```
client/src/
├── components/
│   └── animations/
│       ├── PageTransition.jsx    # Route transition wrapper
│       ├── FadeIn.jsx            # Fade animations
│       ├── ScaleIn.jsx           # Scale animations
│       ├── SlideIn.jsx           # Slide animations
│       ├── AnimatedCard.jsx      # Card animations
│       └── index.js              # Exports
├── utils/
│   └── animations.js             # Animation presets & variants
└── index.css                      # CSS animation classes
```

## Troubleshooting

### Animation not working?
1. Check if Framer Motion is installed: `npm list framer-motion`
2. Verify component is wrapped correctly
3. Check browser console for errors

### Performance issues?
1. Reduce number of animated elements
2. Use CSS animations for simple effects
3. Check if `will-change` CSS property is needed

### Animation too fast/slow?
- Adjust `duration` in animation variants
- Modify `delay` prop on components
- Use `quickTransition` or `slowTransition` presets

## Next Steps

- Add more animation variants as needed
- Create component-specific animations
- Optimize for mobile performance
- Add loading skeleton animations

