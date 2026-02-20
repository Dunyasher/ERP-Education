# Redux Toolkit Store Structure

This directory contains the Redux Toolkit store setup for the Education ERP System.

## Structure

```
store/
├── index.js                 # Store configuration
├── hooks.js                 # Custom Redux hooks
├── slices/                  # Redux slices (feature-based state)
│   ├── authSlice.js        # Authentication state
│   └── themeSlice.js       # Theme state
└── api/                     # RTK Query API setup
    ├── apiSlice.js         # Base API slice with configuration
    └── endpoints/          # API endpoint definitions
        ├── studentsApi.js
        ├── coursesApi.js
        ├── feesApi.js
        └── dashboardApi.js
```

## Usage

### Using Auth State

```javascript
import { useAuth, useAppDispatch } from '../store/hooks';
import { login, logout } from '../store/slices/authSlice';

function MyComponent() {
  const { user, loading, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();

  const handleLogin = async () => {
    await dispatch(login({ email, password }));
  };

  const handleLogout = () => {
    dispatch(logout());
  };
}
```

### Using Theme State

```javascript
import { useTheme } from '../store/hooks';

function MyComponent() {
  const { theme, toggleTheme, setLightMode, setDarkMode } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### Using RTK Query

```javascript
import { useGetStudentsQuery, useCreateStudentMutation } from '../store/api/endpoints/studentsApi';

function StudentsList() {
  const { data: students, isLoading, error } = useGetStudentsQuery();
  const [createStudent, { isLoading: isCreating }] = useCreateStudentMutation();

  const handleCreate = async (studentData) => {
    try {
      await createStudent(studentData).unwrap();
      // Success - cache automatically updates
    } catch (error) {
      // Handle error
    }
  };
}
```

## Benefits

1. **Centralized State**: All application state in one place
2. **Performance**: Optimized re-renders with selectors
3. **DevTools**: Redux DevTools for debugging
4. **Type Safety**: Easy to add TypeScript later
5. **Caching**: RTK Query handles API caching automatically
6. **Lightweight**: Redux Toolkit is optimized for performance

