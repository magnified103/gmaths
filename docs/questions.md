# Questions Management System Documentation

## Overview

The Questions Management System provides comprehensive question authoring, storage, and management capabilities for the GMATHS Education platform. This system supports mathematical content with LaTeX rendering and provides a flexible foundation for multiple question types.

## Architecture

### Frontend Components

#### Core Components
- **QuestionForm.tsx** - Main form for creating/editing questions with MathLive integration
- **QuestionList.tsx** - Paginated list view with filtering and search
- **QuestionCard.tsx** - Individual question display component
- **MathEditor.tsx** - LaTeX-enabled mathematical content editor
- **AnswerOptions.tsx** - Drag-drop answer option management

#### Pages
- **QuestionsPage.tsx** - Main admin page for question management

### Backend API

#### Question Endpoints
```
GET    /api/questions              - List questions with filtering
POST   /api/questions              - Create new question
GET    /api/questions/:id          - Get specific question
PUT    /api/questions/:id          - Update question
DELETE /api/questions/:id          - Delete question
POST   /api/questions/validate     - Validate question data
```

#### Category & Tag Endpoints
```
GET    /api/questions/categories   - List available categories
POST   /api/questions/categories   - Create new category
GET    /api/questions/tags         - List available tags
```

### Database Schema

#### Question Model
```typescript
interface Question {
  id: string;
  type: QuestionType;           // 'multiple-choice' | 'multiple-select' | etc.
  content: string;              // LaTeX-enabled content
  explanation?: string;         // Optional explanation
  points: number;               // Point value (1-10)
  category: string;             // Category ID
  difficulty: Difficulty;       // 'easy' | 'medium' | 'hard'
  tags?: string[];             // Optional tags
  typeData: object;            // Type-specific data (JSON)
  createdAt: string;
  updatedAt: string;
  createdBy: string;           // User ID
}
```

#### Category Model
```typescript
interface QuestionCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;           // For hierarchical categories
  color?: string;              // UI color hint
  questionCount: number;       // Cached count
  createdAt: string;
  updatedAt: string;
}
```

## Question Types

### Phase 1: Multiple Choice (Single Answer)
```typescript
interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: QuestionOption[];
}

interface QuestionOption {
  id: string;
  text: string;                // LaTeX-enabled
  isCorrect: boolean;
  explanation?: string;
}
```

### Future Question Types (Phase 2+)
- **Multiple Select** - Multiple correct answers
- **True/False** - Boolean questions with randomization
- **Fill-in-Blank** - Text input with multiple acceptable answers
- **Essay** - Long-form text responses requiring manual grading

## Features

### ✅ Implemented (Step 1.9)

#### Question Creation
- LaTeX-enabled content editor using MathLive
- Vietnamese UI with comprehensive form validation
- Real-time LaTeX preview
- Drag-drop answer option ordering
- Category selection from backend data
- Difficulty level selection (Easy/Medium/Hard)
- Point value configuration (1-10)

#### Question Management
- Paginated question list with search
- Filter by category, difficulty, and type
- Edit existing questions
- Delete questions with confirmation
- Real-time data synchronization

#### API Integration
- Complete CRUD operations
- Authentication required for all endpoints
- Error handling with Vietnamese messages
- Type-safe API client with TypeScript

#### Data Storage
- Flexible JSON-based storage for type-specific data
- Extensible schema for future question types
- Category and tag system
- Audit trail with created/updated timestamps

### 🚧 Planned Features (Future Phases)

#### Phase 2: Advanced Question Types
- CSV import/export for bulk operations
- Multiple question type support
- Question randomization settings
- Advanced validation rules

#### Phase 3: Analytics & Insights
- Question difficulty analysis
- Performance tracking
- Usage statistics
- Content recommendations

## API Usage Examples

### Creating a Question
```typescript
const questionData: QuestionCreateForm = {
  type: 'multiple-choice',
  content: 'Giải phương trình: \\(x^2 + 5x + 6 = 0\\)',
  explanation: 'Sử dụng công thức nghiệm bậc hai',
  points: 3,
  category: 'algebra',
  difficulty: 'medium',
  options: [
    { text: '\\(x = -2, x = -3\\)', isCorrect: true },
    { text: '\\(x = 2, x = 3\\)', isCorrect: false },
    { text: '\\(x = -1, x = -6\\)', isCorrect: false },
    { text: 'Phương trình vô nghiệm', isCorrect: false }
  ]
};

const question = await createQuestion(questionData);
```

### Fetching Questions with Filters
```typescript
const filters: QuestionFilters = {
  search: 'phương trình',
  category: 'algebra',
  difficulty: 'medium',
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const result = await fetchQuestions(filters, 1, 20);
console.log(`Found ${result.total} questions`);
```

## Testing

### Unit Tests
- Question validation logic
- API client functions
- Form submission handling
- LaTeX content processing

### Integration Tests
- Question CRUD operations
- Category and tag management
- Authentication middleware
- Database transactions

### Manual Testing Checklist
- [ ] Create question with LaTeX content
- [ ] Edit existing question
- [ ] Delete question with confirmation
- [ ] Filter questions by category/difficulty
- [ ] Search questions by content
- [ ] Test LaTeX preview functionality
- [ ] Verify Vietnamese error messages
- [ ] Test responsive design on mobile

## Performance Considerations

### Frontend Optimization
- Debounced search input (300ms)
- Paginated question loading
- Lazy loading of MathLive editor
- Efficient re-rendering with React.memo

### Backend Optimization
- Database indexing on frequently queried fields
- Efficient JSON field queries
- Connection pooling for high concurrency
- Response caching for categories/tags

### Math Rendering
- Client-side LaTeX rendering with MathJax
- Cached math expressions
- Progressive enhancement for math content

## Security

### Authentication
- JWT-based authentication required
- Role-based access control (ADMIN only)
- Secure token storage in localStorage

### Input Validation
- Comprehensive Zod schema validation
- LaTeX content sanitization
- SQL injection prevention via Prisma ORM
- XSS protection for text content

### Data Protection
- Audit logging for all operations
- Soft delete option for questions
- Backup-friendly JSON storage format

## Troubleshooting

### Common Issues

#### MathLive Not Loading
```typescript
// Ensure dynamic import is working
const mathfield = await import('mathlive');
```

#### Categories Not Loading
```bash
# Check backend API
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/questions/categories
```

#### LaTeX Rendering Issues
- Verify MathJax is loaded
- Check LaTeX syntax validity
- Ensure proper escaping in JSON

### Error Handling
All API errors return Vietnamese messages:
```typescript
try {
  await createQuestion(data);
} catch (error) {
  console.error(error.message); // Vietnamese error message
}
```

## Development Notes

### Code Quality Standards
- TypeScript strict mode enabled
- ESLint and Prettier configured
- JSDoc comments for all public functions
- Comprehensive error handling

### File Organization
```
frontend/src/
├── api/questions.ts          # API client
├── components/
│   ├── QuestionForm.tsx      # Question editor
│   ├── QuestionList.tsx      # Question listing
│   ├── QuestionCard.tsx      # Question display
│   ├── MathEditor.tsx        # LaTeX editor
│   └── AnswerOptions.tsx     # Answer management
├── hooks/useAutoSave.ts      # Auto-save functionality
├── pages/QuestionsPage.tsx   # Main page
└── types/questions.ts        # Type definitions
```

### Future Enhancements
- Auto-save draft functionality
- Question preview modal
- Bulk operations interface
- Advanced search with tags
- Question templates
- Collaborative editing

---

**Last Updated:** Step 1.9 - Question Management Integration and Testing
**Status:** ✅ Complete - Frontend-backend integration functional
**Next:** Step 1.10 - Exam Creation UI 