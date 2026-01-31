# 📱 Comprehensive Responsive Design Guide

This guide documents the responsive design system implemented for the furniture e-commerce application, ensuring optimal experience across all devices.

## 🎯 Design Philosophy

**Mobile-First Approach**: All styles are designed mobile-first, then enhanced for larger screens.

## 📐 Breakpoints

| Breakpoint | Width | Device Type | Usage |
|------------|-------|------------|-------|
| `xs` | < 640px | Mobile Small | Small phones (iPhone SE, etc.) |
| `sm` | 640px - 767px | Mobile Large | Large phones (iPhone 12/13/14, etc.) |
| `md` | 768px - 1023px | Tablet | Tablets (iPad, etc.) |
| `lg` | 1024px - 1279px | Desktop | Small laptops, desktops |
| `xl` | 1280px - 1535px | Desktop Large | Large desktops |
| `2xl` | ≥ 1536px | Extra Large | Ultra-wide displays |

## 🛠️ Responsive Utilities

### Container Classes

```jsx
// Responsive container with automatic padding
<div className="container-responsive">
  {/* Content */}
</div>
```

### Grid System

```jsx
// Responsive grid - adapts to screen size
<div className="responsive-grid">
  {/* Items automatically adjust columns */}
</div>

// Product grid with optimized breakpoints
<div className="product-grid">
  {/* 2 cols mobile, 3 cols tablet, 4 cols desktop */}
</div>
```

### Typography

```jsx
// Responsive text sizes
<h1 className="responsive-text-4xl">Title</h1>
<p className="responsive-text-base">Body text</p>
```

### Spacing

```jsx
// Responsive padding
<div className="responsive-padding">
  {/* Auto-adjusts padding for each breakpoint */}
</div>

// Responsive margins
<div className="responsive-margin-y">
  {/* Vertical margins adjust automatically */}
</div>
```

### Visibility Utilities

```jsx
// Hide on mobile, show on desktop
<div className="hide-mobile show-desktop">
  Desktop only content
</div>

// Show on mobile, hide on desktop
<div className="hide-desktop">
  Mobile only content
</div>
```

### Touch-Friendly Elements

```jsx
// Minimum 44x44px touch target
<button className="touch-target">
  Tap me
</button>
```

## 🎨 Component-Specific Responsive Patterns

### Product Grid

```jsx
// Automatically responsive product grid
<ProductGrid 
  products={products}
  gridType="grid2" // 2 cols mobile, 3 tablet, 4 desktop
/>
```

**Breakpoints:**
- Mobile (< 640px): 2 columns
- Tablet (640px - 1023px): 3 columns
- Desktop (≥ 1024px): 4 columns
- Large Desktop (≥ 1280px): 4-5 columns

### Navigation

**Desktop (≥ 1024px):**
- Full horizontal navbar
- All menu items visible
- Search bar in header

**Mobile (< 1024px):**
- Hamburger menu
- Bottom navigation bar
- Collapsible search

### Bottom Navigation

- Only visible on mobile/tablet (< 1024px)
- Fixed at bottom with safe area insets
- Touch-friendly icons (44px minimum)
- Smooth animations

### Forms

**Mobile:**
- Full-width inputs
- 16px font size (prevents iOS zoom)
- Stacked layout
- Large touch targets

**Desktop:**
- Optimal width constraints
- Side-by-side layouts where appropriate
- Hover states

## 📱 Mobile-Specific Features

### Safe Area Insets

For devices with notches (iPhone X and newer):

```jsx
<div className="safe-area-top">
  {/* Content respects notch area */}
</div>

<div className="safe-area-bottom">
  {/* Content respects home indicator */}
</div>
```

### Touch Interactions

- All interactive elements are minimum 44x44px
- Tap highlight removed for cleaner UX
- Smooth scrolling enabled
- Prevent zoom on double-tap (iOS)

### Landscape Mode

```css
/* Compact layout in landscape */
@media (orientation: landscape) and (max-height: 500px) {
  .landscape-compact {
    padding: 0.5rem;
  }
}
```

## 🖥️ Desktop Enhancements

### Hover States

- Cards lift on hover
- Buttons show elevation
- Smooth transitions

### Grid Layouts

- More columns on larger screens
- Better spacing
- Optimal content width

## 🎯 Best Practices

### 1. Mobile-First CSS

Always write mobile styles first, then enhance:

```css
/* Mobile first */
.button {
  width: 100%;
  padding: 1rem;
}

/* Then enhance for larger screens */
@media (min-width: 640px) {
  .button {
    width: auto;
    padding: 1rem 2rem;
  }
}
```

### 2. Use Responsive Utilities

Prefer utility classes over custom media queries:

```jsx
// ✅ Good
<div className="responsive-padding product-grid">

// ❌ Avoid
<div className="custom-responsive-div">
```

### 3. Test on Real Devices

- Test on actual phones, tablets, and desktops
- Check different orientations
- Verify touch interactions
- Test with slow connections

### 4. Performance

- Use `loading="lazy"` for images
- Optimize images for different screen sizes
- Minimize layout shifts
- Use CSS containment where possible

### 5. Accessibility

- Maintain minimum touch target sizes (44x44px)
- Ensure sufficient color contrast
- Test with screen readers
- Support keyboard navigation

## 🔧 Using the Responsive Hook

```jsx
import { useResponsive } from '@/hooks/use-responsive';

function MyComponent() {
  const { 
    isMobile, 
    isTablet, 
    isDesktop,
    deviceType,
    orientation 
  } = useResponsive();

  return (
    <div>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isDesktop && <DesktopView />}
    </div>
  );
}
```

## 📊 Responsive Checklist

When creating new components, ensure:

- [ ] Works on mobile (320px+)
- [ ] Works on tablet (768px+)
- [ ] Works on desktop (1024px+)
- [ ] Touch targets are 44x44px minimum
- [ ] Text is readable (minimum 14px)
- [ ] Images are responsive
- [ ] Forms work on mobile (16px font size)
- [ ] Safe area insets respected
- [ ] Landscape orientation supported
- [ ] Dark mode compatible
- [ ] Reduced motion respected
- [ ] Keyboard navigation works

## 🐛 Common Issues & Solutions

### Issue: Horizontal Scroll

**Solution:**
```css
body {
  overflow-x: hidden;
  width: 100%;
}
```

### Issue: iOS Zoom on Input Focus

**Solution:**
```css
input, textarea, select {
  font-size: 16px !important;
}
```

### Issue: Safe Area Not Respected

**Solution:**
```css
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Issue: Text Too Small on Mobile

**Solution:**
```css
@media (max-width: 639px) {
  body {
    font-size: 16px;
  }
}
```

## 📚 Resources

- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries)
- [Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

## 🎉 Summary

The responsive design system ensures:

✅ **Mobile-First**: Optimized for mobile devices first
✅ **Progressive Enhancement**: Enhanced for larger screens
✅ **Touch-Friendly**: All interactive elements are easily tappable
✅ **Accessible**: Meets WCAG guidelines
✅ **Performance**: Optimized for all connection speeds
✅ **Cross-Device**: Works on phones, tablets, and desktops
✅ **Future-Proof**: Uses modern CSS features with fallbacks

---

**Remember**: Always test on real devices, not just browser dev tools!

