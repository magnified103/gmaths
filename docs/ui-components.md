# UI Components Documentation

This document provides comprehensive documentation for all reusable UI components in the GMATHS Education Platform frontend.

## Core UI Components

### 1. Alert (`components/ui/Alert.tsx`)

A flexible alert component for displaying messages with different severity levels.

**Props:**
- `type`: `'success' | 'error' | 'warning' | 'info'` (required) - Alert type
- `title`: `string` (optional) - Alert title
- `message`: `string | React.ReactNode` (required) - Alert content
- `onClose`: `() => void` (optional) - Close callback for dismissible alerts
- `className`: `string` (optional) - Additional CSS classes

**Usage:**
```tsx
<Alert 
  type="success" 
  title="Thành công!" 
  message="Người dùng đã được tạo thành công." 
/>

<Alert 
  type="error" 
  message="Đã xảy ra lỗi không mong muốn." 
  onClose={() => setShowAlert(false)}
/>
```

**Features:**
- Vietnamese messaging support
- Color-coded styling based on type
- Optional dismissible functionality
- Icon integration
- Flexible content support

---

### 2. BrandLogo (`components/ui/BrandLogo.tsx`)

Unified GMATHS branding component with multiple variants and sizes.

**Props:**
- `variant`: `'default' | 'auth' | 'admin'` (default: 'default') - Logo variant
- `size`: `'sm' | 'md' | 'lg'` (default: 'md') - Logo size
- `showText`: `boolean` (default: true) - Show/hide brand text
- `className`: `string` (optional) - Additional CSS classes
- `linkTo`: `string` (default: '/') - Link destination

**Usage:**
```tsx
<BrandLogo variant="auth" size="lg" linkTo="/" />
<BrandLogo variant="admin" showText={false} />
<BrandLogo size="sm" className="mb-4" />
```

**Features:**
- Three predefined variants for different contexts
- Responsive sizing options
- Optional link functionality
- Consistent brand representation
- Accessible markup

---

### 3. Button (`components/ui/Button.tsx`)

Comprehensive button component with multiple variants, sizes, and states.

**Props:**
- `variant`: `'primary' | 'secondary' | 'danger' | 'ghost'` (default: 'primary') - Button style
- `size`: `'sm' | 'md' | 'lg'` (default: 'md') - Button size
- `isLoading`: `boolean` (default: false) - Loading state
- `loadingText`: `string` (optional) - Text during loading
- `icon`: `React.ReactNode` (optional) - Button icon
- `iconPosition`: `'left' | 'right'` (default: 'left') - Icon position
- `fullWidth`: `boolean` (default: false) - Full width button
- Plus all standard button HTML attributes

**Usage:**
```tsx
<Button variant="primary" size="md">
  Lưu thay đổi
</Button>

<Button 
  variant="danger" 
  isLoading={isDeleting}
  loadingText="Đang xóa..."
  icon={<TrashIcon className="w-4 h-4" />}
>
  Xóa người dùng
</Button>

<Button variant="ghost" size="sm" fullWidth>
  Hủy bỏ
</Button>
```

**Features:**
- Four distinct visual variants
- Loading states with spinner
- Icon support with positioning
- Full TypeScript support
- Consistent focus and hover states

---

### 4. EmptyState (`components/ui/EmptyState.tsx`)

Consistent empty state messaging with optional actions.

**Props:**
- `icon`: `React.ReactNode` (optional) - Empty state icon
- `title`: `string` (required) - Empty state title
- `description`: `string` (optional) - Description text
- `action`: `object` (optional) - Action button configuration
  - `label`: `string` - Button text
  - `onClick`: `() => void` - Button click handler
  - `variant`: `'primary' | 'secondary'` - Button style
  - `icon`: `React.ReactNode` - Button icon
- `className`: `string` (optional) - Additional CSS classes

**Usage:**
```tsx
<EmptyState
  title="Chưa có người dùng nào"
  description="Bắt đầu bằng cách tạo người dùng đầu tiên."
  action={{
    label: "Tạo người dùng",
    onClick: handleCreateUser,
    variant: "primary",
    icon: <UserPlusIcon className="w-4 h-4" />
  }}
/>
```

**Features:**
- Flexible icon support
- Optional call-to-action
- Vietnamese messaging
- Consistent spacing and typography

---

### 5. FormField (`components/ui/FormField.tsx`)

Reusable form field component with validation display and various input types.

**Props:**
- `id`: `string` (required) - Field identifier
- `label`: `string` (required) - Field label
- `type`: `'text' | 'email' | 'password' | 'select'` (default: 'text') - Input type
- `placeholder`: `string` (optional) - Placeholder text
- `required`: `boolean` (default: false) - Required field indicator
- `error`: `string` (optional) - Error message
- `helpText`: `string` (optional) - Help text
- `value`: `string` (optional) - Field value (controlled)
- `onChange`: `function` (optional) - Change handler (controlled)
- `options`: `array` (optional) - Select options
- `showPasswordToggle`: `boolean` (default: false) - Password visibility toggle
- `showPassword`: `boolean` (default: false) - Password visibility state
- `onTogglePassword`: `function` (optional) - Password toggle handler
- `disabled`: `boolean` (default: false) - Disabled state
- `className`: `string` (optional) - Additional CSS classes
- `register`: `function` (optional) - React Hook Form register

**Usage:**
```tsx
<FormField
  id="email"
  label="Email"
  type="email"
  placeholder="Nhập email của bạn"
  required
  error={errors.email?.message}
  register={register}
/>

<FormField
  id="password"
  label="Mật khẩu"
  type="password"
  showPasswordToggle
  showPassword={showPassword}
  onTogglePassword={() => setShowPassword(!showPassword)}
  register={register}
/>
```

**Features:**
- Multiple input types support
- React Hook Form integration
- Validation error display
- Password visibility toggle
- Vietnamese labels and messages
- Consistent styling and behavior

---

### 6. FullScreenLoader (`components/ui/FullScreenLoader.tsx`)

Centralized full-screen loading patterns for different contexts.

**Props:**
- `message`: `string` (default: 'Đang tải...') - Loading message
- `variant`: `'center' | 'page'` (default: 'center') - Display variant
- `showSpinner`: `boolean` (default: true) - Show/hide spinner
- `className`: `string` (optional) - Additional CSS classes

**Usage:**
```tsx
<FullScreenLoader message="Đang tải dữ liệu..." />

<FullScreenLoader 
  variant="page"
  message="Tính năng đang được phát triển"
  showSpinner={false}
/>
```

**Features:**
- Two display variants (center, page)
- Customizable messaging
- Optional spinner control
- Vietnamese default messages
- Accessible loading states

---

### 7. LoadingSpinner (`components/ui/LoadingSpinner.tsx`)

Flexible loading spinner component with multiple sizes and contexts.

**Props:**
- `size`: `'sm' | 'md' | 'lg' | 'xl'` (default: 'md') - Spinner size
- `text`: `string` (optional) - Loading text
- `className`: `string` (optional) - Additional CSS classes
- `fullScreen`: `boolean` (default: false) - Full screen mode

**Usage:**
```tsx
<LoadingSpinner size="lg" text="Đang xử lý..." />
<LoadingSpinner size="sm" />

{/* Button-specific spinner */}
<ButtonSpinner text="Đang lưu..." />
```

**Features:**
- Multiple size options
- Optional text display
- Full screen capability
- Specialized button spinner export
- Smooth animations

---

### 8. Modal (`components/ui/Modal.tsx`)

Flexible modal component with multiple sizes and footer support.

**Props:**
- `isOpen`: `boolean` (required) - Modal visibility
- `onClose`: `() => void` (required) - Close handler
- `title`: `string` (required) - Modal title
- `subtitle`: `string` (optional) - Modal subtitle
- `children`: `React.ReactNode` (required) - Modal content
- `footer`: `React.ReactNode` (optional) - Modal footer
- `size`: `'sm' | 'md' | 'lg' | 'xl' | '2xl'` (default: 'md') - Modal size
- `showCloseButton`: `boolean` (default: true) - Show close button

**Usage:**
```tsx
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Tạo người dùng mới"
  subtitle="Nhập thông tin để tạo tài khoản người dùng"
  size="lg"
  footer={<ModalFooterButtons />}
>
  <UserForm />
</Modal>
```

**Features:**
- Multiple size options
- Flexible content and footer
- Keyboard navigation (ESC key)
- Click outside to close
- Vietnamese titles and messages
- Smooth animations

---

### 9. StatusBadge (`components/ui/StatusBadge.tsx`)

Standardized status indicators for roles and verification states.

**Props:**
- `status`: `'admin' | 'student' | 'verified' | 'unverified' | 'active' | 'inactive' | 'success' | 'error' | 'warning' | 'info'` (required) - Status type
- `label`: `string` (required) - Badge text
- `size`: `'sm' | 'md'` (default: 'md') - Badge size
- `className`: `string` (optional) - Additional CSS classes

**Usage:**
```tsx
<StatusBadge status="admin" label="Quản trị viên" />
<StatusBadge status="verified" label="Đã xác thực" size="sm" />
<StatusBadge status="error" label="Lỗi xác thực" />
```

**Features:**
- Predefined status colors
- Two size options
- Vietnamese labels
- Consistent styling
- Role and state indicators

---

## Layout Components

### 10. AdminLayout (`components/admin/AdminLayout.tsx`)

Administrative interface layout with navigation and branding.

**Props:**
- `children`: `React.ReactNode` (required) - Page content

**Usage:**
```tsx
<AdminLayout>
  <AdminPageContent />
</AdminLayout>
```

**Features:**
- Sidebar navigation
- Responsive design
- Vietnamese navigation items
- Current page highlighting
- GMATHS branding integration

---

### 11. AuthLayout (`components/AuthLayout.tsx`)

Authentication pages layout with GMATHS branding.

**Props:**
- `children`: `React.ReactNode` (required) - Form content
- `title`: `string` (required) - Page title
- `subtitle`: `string` (optional) - Page subtitle

**Usage:**
```tsx
<AuthLayout title="Đăng nhập" subtitle="Truy cập vào tài khoản của bạn">
  <LoginForm />
</AuthLayout>
```

**Features:**
- Centered layout design
- Gradient background
- Vietnamese titles
- Brand logo integration
- Responsive design

---

### 12. Layout (`components/Layout.tsx`)

Main application layout for public pages.

**Props:**
- `children`: `React.ReactNode` (required) - Page content
- `className`: `string` (optional) - Additional CSS classes

**Usage:**
```tsx
<Layout className="bg-gray-50">
  <HomePage />
</Layout>
```

**Features:**
- Header and footer integration
- Flexible main content area
- Responsive design
- Vietnamese navigation

---

## Design Principles

### Consistency
All components follow consistent design patterns:
- Vietnamese text for user-facing content
- Tailwind CSS for styling
- 2-space indentation
- TypeScript strict typing

### Accessibility
Components include accessibility features:
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management

### Performance
Optimized for performance:
- Minimal re-renders
- Efficient prop handling
- Code splitting ready
- Bundle size optimization

### Maintainability
Built for long-term maintenance:
- Clear prop interfaces
- JSDoc documentation
- Consistent naming conventions
- Extensible design patterns

## Usage Guidelines

1. **Import components from their specific paths:**
   ```tsx
   import Button from '../components/ui/Button';
   import Modal from '../components/ui/Modal';
   ```

2. **Use Vietnamese text for all user-facing content:**
   ```tsx
   <Button>Lưu thay đổi</Button>
   <Alert message="Cập nhật thành công!" />
   ```

3. **Follow TypeScript strict typing:**
   ```tsx
   interface MyComponentProps {
     title: string;
     onSubmit: (data: FormData) => void;
   }
   ```

4. **Leverage component composition:**
   ```tsx
   <Modal isOpen={isOpen} onClose={onClose}>
     <Alert type="warning" message="Xác nhận hành động?" />
     <Button variant="primary">Xác nhận</Button>
   </Modal>
   ```

This component library provides a solid foundation for building consistent, accessible, and maintainable user interfaces throughout the GMATHS Education Platform. 