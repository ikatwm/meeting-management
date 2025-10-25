# Meeting Manager Frontend

A modern Next.js application for managing candidate interviews and meetings.

## Features

- **Authentication**: Secure JWT-based authentication with NextAuth.js
- **Dashboard**: View and manage upcoming meetings with pagination
- **Meeting Booking**: Schedule new meetings with candidates
- **Meeting Management**: Edit and delete existing meetings
- **Candidate Profiles**: View detailed candidate information, meeting history, and interview notes
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript support with strict typing
- **Form Validation**: Client-side validation with Zod and React Hook Form
- **Real-time Feedback**: Toast notifications for user actions

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Notifications**: react-hot-toast

## Prerequisites

- Node.js 18+ and pnpm
- Backend API running (see `/apps/backend/README.md`)

## Setup Instructions

### 1. Install Dependencies

From the project root:

```bash
pnpm install
```

### 2. Environment Configuration

Create `.env.local` in `/apps/frontend`:

```bash
cp .env.local.example .env.local
```

Update the environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXTAUTH_URL=http://localhost:4200
NEXTAUTH_SECRET=your-secret-key-here
```

Generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Start Development Server

From the project root:

```bash
pnpm nx serve frontend
```

Or directly from the frontend directory:

```bash
cd apps/frontend
pnpm dev
```

The application will be available at [http://localhost:4200](http://localhost:4200)

## Project Structure

```
apps/frontend/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── api/                  # API routes
│   │   │   └── auth/             # NextAuth configuration
│   │   ├── login/                # Login page
│   │   ├── dashboard/            # Dashboard page
│   │   ├── meetings/             # Meeting pages
│   │   │   ├── new/              # Create meeting
│   │   │   └── [id]/edit/        # Edit meeting
│   │   ├── candidates/           # Candidate pages
│   │   │   └── [id]/             # Candidate detail
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page (redirects to dashboard)
│   ├── components/               # React components
│   │   ├── ui/                   # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Loading.tsx
│   │   └── layouts/              # Layout components
│   │       ├── Header.tsx
│   │       └── AuthProvider.tsx
│   ├── lib/                      # Utilities and helpers
│   │   ├── api-client.ts         # API client with Axios
│   │   └── providers/            # Context providers
│   │       └── ToastProvider.tsx
│   └── types/                    # TypeScript type definitions
│       ├── index.ts              # API types
│       └── next-auth.d.ts        # NextAuth type extensions
├── public/                       # Static assets
├── .env.local.example            # Environment template
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## Available Pages

### Public Pages

- `/login` - Authentication page

### Protected Pages (require authentication)

- `/dashboard` - Main dashboard with meeting list
- `/meetings/new` - Schedule a new meeting
- `/meetings/[id]/edit` - Edit existing meeting
- `/candidates/[id]` - Candidate profile and history

## API Integration

The frontend communicates with the backend API through the `apiClient` utility:

```typescript
import { apiClient } from '@/lib/api-client';

// Example: Fetch meetings
const meetings = await apiClient.getMeetings({ page: 1, limit: 10 });

// Example: Create meeting
await apiClient.createMeeting({
  title: 'Technical Interview',
  candidateId: 1,
  startTime: '2025-10-26T10:00:00',
  endTime: '2025-10-26T11:00:00',
  location: 'Conference Room A',
  meetingType: 'onsite',
  status: 'confirmed',
});
```

All API calls automatically include the JWT token from the user's session.

## Authentication Flow

1. User submits credentials on `/login`
2. NextAuth validates credentials with the backend API
3. JWT token is stored in the session
4. Protected routes check for valid session via middleware
5. API client automatically includes token in all requests
6. Session expires after 24 hours or on logout

## Component Usage

### Button

```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>;
```

Variants: `primary`, `secondary`, `danger`, `ghost`
Sizes: `sm`, `md`, `lg`

### Input

```tsx
import { Input } from '@/components/ui/Input';

<Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />;
```

### Select

```tsx
import { Select } from '@/components/ui/Select';

<Select
  label="Position"
  options={[
    { value: 1, label: 'Software Engineer' },
    { value: 2, label: 'Product Manager' },
  ]}
  {...register('positionId')}
/>;
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>;
```

### Modal

```tsx
import { Modal } from '@/components/ui/Modal';

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modal Title">
  <p>Modal content</p>
</Modal>;
```

## Form Validation

Forms use React Hook Form with Zod for validation:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

## Styling Guidelines

This project uses Tailwind CSS with a custom design system:

### Color Palette

- **Primary**: Blue (`primary-50` to `primary-900`)
- **Success**: Green (`success-50` to `success-900`)
- **Warning**: Yellow (`warning-50` to `warning-900`)
- **Danger**: Red (`danger-50` to `danger-900`)

### Responsive Breakpoints

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Common Patterns

```tsx
// Container
<div className="container mx-auto">

// Card with hover effect
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">

// Primary button
<button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">

// Input field
<input className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
```

## Error Handling

All API errors are handled gracefully with toast notifications:

```tsx
try {
  await apiClient.createMeeting(data);
  toast.success('Meeting created successfully!');
} catch (error) {
  toast.error('Failed to create meeting');
  console.error(error);
}
```

## Accessibility

All components follow WCAG 2.1 AA standards:

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Color contrast compliance
- Screen reader friendly

## Testing

Run TypeScript type checking:

```bash
pnpm nx type-check frontend
```

Run ESLint:

```bash
pnpm nx lint frontend
```

## Build for Production

```bash
pnpm nx build frontend
```

The optimized production build will be in `/dist/apps/frontend`.

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker

Build the Docker image:

```bash
docker build -t meeting-manager-frontend -f apps/frontend/Dockerfile .
```

Run the container:

```bash
docker run -p 4200:3000 -e NEXT_PUBLIC_API_URL=https://api.example.com meeting-manager-frontend
```

## Troubleshooting

### Authentication Issues

- Ensure `NEXTAUTH_SECRET` is set in `.env.local`
- Verify `NEXT_PUBLIC_API_URL` points to the correct backend
- Check that the backend API is running and accessible

### API Connection Issues

- Verify the backend API is running on the specified port
- Check CORS configuration in the backend
- Ensure JWT tokens are being sent in requests (check Network tab)

### Build Errors

- Clear the `.next` cache: `rm -rf .next`
- Delete `node_modules` and reinstall: `pnpm install`
- Check for TypeScript errors: `pnpm nx type-check frontend`

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run linting and type checking: `pnpm nx lint frontend && pnpm nx type-check frontend`
4. Commit changes: `git commit -m "feat: add my feature"`
5. Push to branch: `git push origin feature/my-feature`
6. Create a Pull Request

## License

MIT
