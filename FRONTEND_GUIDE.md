# Mobile Phone Store & Repair POS - Frontend Guide

## Overview

This is a production-ready React/Next.js 16 frontend for the Mobile Phone Store & Repair POS system. The UI features an Electric Black theme with 3D tilt interactions, real-time API integration, and comprehensive error handling.

## Architecture & Components

### Design System

**Color Palette (Electric Black Theme):**
- **Primary Background**: `#000000` (Pure Black)
- **Secondary Background**: `#0B0F19` (Dark Charcoal)
- **Accents**:
  - `#00F2FE` (Electric Cyan) - Primary action, positive states
  - `#4FACFE` (Neon Purple) - Secondary action, secondary states
  - `#00FF87` (Emerald Green) - Success, completed states
  - `#ff3366` (Neon Red) - Error, destructive states
  - `#FFD700` (Gold) - Warnings, important alerts

### Core Components

#### 1. **API Client Service** (`lib/api-client.ts`)
- **Axios-based HTTP client** with automatic tenant ID injection
- **Global error handling** with interceptors:
  - 401: Redirects to login
  - 409: Triggers conflict notification
  - 400/422: Pipes validation errors to UI
  - 500+: Generic server error handling
- **Endpoints**:
  - `posApi.scanDevice()` - GET `/api/v1/pos/products/scan/:imei`
  - `posApi.checkout()` - POST `/api/v1/pos/sales/checkout`
  - `repairApi.createJob()` - POST `/api/v1/repair/jobs`
  - `repairApi.updateStatus()` - PATCH `/api/v1/repair/jobs/:id/status`

#### 2. **State Management** (`lib/store.ts`)
- **Zustand stores** for global state:
  - `useToastStore` - Toast notifications
  - `useCartStore` - Shopping cart items and totals
  - `useRepairStore` - Repair jobs and selected job
  - `useAppStore` - Global app state (loading, tenant ID)

#### 3. **3D Tilt Hook** (`hooks/use3DTilt.ts`)
- **Custom React hook** calculating 3D perspective transforms
- **Mouse tracking**: Computes `rotateX` and `rotateY` based on cursor position
- **Fallback**: Touch devices use `scale(1.02)` instead of 3D transforms
- **Performance**: GPU-accelerated transforms with hardware acceleration

#### 4. **UI Components**

##### `Toast.tsx`
- **Toast notifications** system with automatic dismissal (4s default)
- **Types**: success, error, warning, info
- **Fixed position** in bottom-right corner
- **Auto-dismiss** or manual close button

##### `IMEIScanner.tsx`
- **Barcode/IMEI input field** with laser sweep animation
- **Laser line effect**: Cyan vertical sweep when focused
- **Debounce**: 300ms+ compatible with hardware scanners
- **Real-time feedback**: Adds to cart on successful scan
- **Error handling**: Shows sold/unavailable status with dates

##### `RepairJobForm.tsx`
- **Creation form** for repair jobs
- **Client-side validation**: Phone format, required fields
- **Form fields**: Customer name, phone, device model, serial/IMEI, issue description
- **Error display**: Individual field error messages
- **State management**: Resets form on success

##### `CartSummary.tsx`
- **Invoice cart** display with 3D tilt effect
- **Features**: Item list, price display, subtotal/tax/total
- **Actions**: Remove item, clear cart, checkout button
- **Responsive**: Scrollable list with overflow handling

##### `TiltCard.tsx`
- **Reusable 3D tilt card component**
- **Features**: Mouse tracking, radial gradient spotlight, glowColor prop
- **Touch fallback**: Scale(1.02) on touch devices
- **Customizable**: className, onClick, glowColor props

##### `ErrorBoundary.tsx`
- **React Error Boundary** preventing total app crashes
- **Displays**: Error message, reset button, dev error details
- **Graceful fallback**: Guides user to retry or go home

### Page Structure

#### `app/page.tsx` (Dashboard)
- **Layout**: 2-column grid (scanner + controls, cart summary)
- **Sections**:
  - Header with branding and tenant info
  - Quick start buttons
  - IMEI Scanner input
  - Repair Job Form (modal overlay)
  - System status card
  - Features grid (6 feature cards)
  - API documentation links

#### `app/layout.tsx`
- **Root layout** with error boundary wrapper
- **Dark theme** applied globally
- **Analytics integration** (Vercel)

#### `app/globals.css`
- **Electric Black theme** variables
- **Custom animations**:
  - `laser-sweep` (1.5s) - Vertical line animation
  - `neon-glow` (3s infinite) - Pulsing glow effect
  - `slide-in` (0.3s) - Toast entry animation
  - `skeleton-shimmer` (2s infinite) - Loading skeleton effect
- **Tailwind v4** with custom theme tokens

## API Integration

### Request Flow

1. **Scan Device**:
   ```
   User scans IMEI
   → IMEIScanner component calls posApi.scanDevice()
   → Axios adds X-Tenant-Id header
   → Backend returns device details
   → addItem() adds to cart
   → Toast shows success message
   ```

2. **Create Repair Job**:
   ```
   User fills form
   → RepairJobForm validates locally
   → repairApi.createJob() sends POST
   → Backend generates JOB-YYYY-NNNN
   → Modal closes, job appears in list
   → Toast shows job number
   ```

3. **Update Repair Status**:
   ```
   User moves card to "Completed"
   → Modal opens for parts selection
   → repairApi.updateStatus() sends PATCH
   → Backend deducts inventory (atomic)
   → Returns cost breakdown
   → Card updates with status
   ```

### Error Handling

**Automatic retry on**:
- Network timeout (30s)
- 5xx server errors

**User-visible errors**:
- 400/422: Validation - shows field-level errors
- 409: Conflict - displays available stock quantities
- 404: Not found - clear message
- 401: Unauthorized - redirects to login

## Performance Optimizations

### Frontend

1. **3D Transform Optimization**:
   - GPU-accelerated transforms
   - `will-change: transform` on tilt cards
   - Touch device detection (no 3D on mobile)

2. **Component Optimization**:
   - Lazy component loading
   - Skeleton loaders during API calls
   - Debounced scanner input

3. **Animation Performance**:
   - CSS keyframe animations (not JavaScript)
   - Hardware acceleration via `transform` property
   - Fixed animation durations

4. **State Management**:
   - Zustand (lightweight, no Redux boilerplate)
   - Minimal re-renders via selector-based subscriptions
   - Direct state updates (no immer/middleware)

## Responsive Design

### Breakpoints

- **Mobile**: < 768px
  - Single-column layout
  - Cards full width
  - Touch-friendly buttons
  - No 3D tilt (scale instead)

- **Tablet**: 768px - 1024px
  - 2-column layout with adjusted spacing
  - Scanner and cart side-by-side

- **Desktop**: > 1024px
  - Full 3-column layout
  - 3D tilt effects enabled
  - Spotlight cursor tracking

### Mobile Optimizations

- **Input**: Full width, larger touch targets
- **Scanner**: Laser effect still visible
- **Cards**: Scale(1.02) on tap instead of 3D tilt
- **Touch**: No hover effects, tap feedback instead

## File Structure

```
app/
├── layout.tsx                 # Root layout with error boundary
├── globals.css               # Theme variables and animations
├── page.tsx                  # Dashboard page
└── api/v1/
    ├── pos/products/scan/[imei_or_serial]/route.ts
    ├── pos/sales/checkout/route.ts
    └── repair/jobs/[id]/status/route.ts

components/
├── Toast.tsx                 # Toast notification system
├── IMEIScanner.tsx          # IMEI barcode scanner
├── CartSummary.tsx          # Shopping cart display
├── RepairJobForm.tsx        # Repair job creation form
├── TiltCard.tsx             # 3D tilt card component
└── ErrorBoundary.tsx        # Error boundary wrapper

lib/
├── api-client.ts            # Axios API client with interceptors
├── store.ts                 # Zustand state stores
├── db.ts                    # Database utilities
└── types.ts                 # TypeScript interfaces

hooks/
└── use3DTilt.ts             # 3D tilt custom hook
```

## Usage Examples

### Using the API Client

```typescript
import { posApi, repairApi } from '@/lib/api-client';

// Scan device
const device = await posApi.scanDevice('123456789012345', tenantId);

// Create repair job
const job = await repairApi.createJob({
  tenant_id: tenantId,
  customer_name: 'John Doe',
  customer_phone: '+1 (555) 123-4567',
  device_model: 'iPhone 15 Pro',
  serial_or_imei: 'A1234B5678C9D012E3F45',
  issue_description: 'Screen cracked',
});

// Update repair status
const updated = await repairApi.updateStatus(jobId, {
  tenant_id: tenantId,
  new_status: 'Completed',
  labor_fee: 50,
  used_parts: [
    {
      variant_id: 'part-uuid-1',
      quantity: 1,
      custom_price: 150,
    },
  ],
});
```

### Using Zustand Stores

```typescript
import { useToastStore, useCartStore, useRepairStore } from '@/lib/store';

// Show toast
const { addToast } = useToastStore();
addToast({
  type: 'success',
  message: 'Device added to cart',
  duration: 3000,
});

// Manage cart
const { addItem, removeItem, getTotal } = useCartStore();
addItem({ id: 'dev-1', imei_1: '123...', ... });
const total = getTotal();

// Manage repairs
const { addJob, updateJob, selectJob } = useRepairStore();
addJob(jobData);
updateJob(jobId, { status: 'Completed' });
```

### Using the 3D Tilt Hook

```typescript
import { use3DTilt } from '@/hooks/use3DTilt';

export function MyCard() {
  const { ref, tilt, handleMouseMove, handleMouseLeave, style } = use3DTilt(15, 1.05);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      className="card"
    >
      {/* Content */}
    </div>
  );
}
```

## Testing

### Manual Testing Checklist

- [ ] Scan valid IMEI - device adds to cart
- [ ] Scan sold IMEI - shows error with sale date
- [ ] Scan invalid IMEI - shows 404 error
- [ ] Create repair job - form validates and submits
- [ ] Invalid phone format - shows validation error
- [ ] Update repair status - handles parts deduction
- [ ] Insufficient stock - shows 409 conflict with quantities
- [ ] Mobile view - cards scale instead of tilt
- [ ] Error boundary - catches and displays errors gracefully
- [ ] Toast notifications - auto-dismiss and manual close work

### Running Tests

```bash
# Type checking
pnpm tsc --noEmit

# Linting
pnpm lint

# Build
pnpm build

# Run dev server
pnpm dev
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Note**: 3D transforms via `transform: perspective` require modern browsers. Touch devices gracefully fallback to `scale()`.

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:3000  # API base URL
```

Set in `.env.local` for development or configure in Vercel dashboard for production.

## Performance Metrics

**Target Web Vitals:**
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

**Achieved via:**
- GPU-accelerated animations
- Minimal JavaScript bundle
- Lazy component loading
- Optimized re-renders

## Troubleshooting

### 3D tilt not working
- Check browser supports CSS 3D transforms
- Verify `will-change: transform` applied
- On touch devices, check `isTouchDevice()` fallback

### API calls failing
- Verify tenant ID is set correctly
- Check `X-Tenant-Id` header in network tab
- Confirm backend is running on correct port

### Toast not showing
- Ensure `<Toast />` is rendered in layout
- Check z-index: 50 doesn't conflict
- Verify `useToastStore` is called before rendering

### Styles not loading
- Check globals.css is imported in layout
- Verify Tailwind CSS compilation
- Confirm dark theme class on `<html>`

## Future Enhancements

- [ ] Real-time repair status with WebSockets
- [ ] Inventory dashboard with stock alerts
- [ ] Customer history and analytics
- [ ] Multi-location support
- [ ] Offline mode with sync
- [ ] Mobile app (React Native)
