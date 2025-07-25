import { z } from 'zod';

// Common field validations
export const commonValidations = {
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: (passwordField: string = 'password') => z.string()
    .min(1, 'Please confirm your password'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date (YYYY-MM-DD)'),
  dateTime: z.string().datetime('Please enter a valid date and time'),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonNegativeNumber: z.number().min(0, 'Must be a non-negative number'),
  percentage: z.number().min(0, 'Percentage cannot be negative').max(100, 'Percentage cannot exceed 100'),
  grade: z.number().min(0, 'Grade cannot be negative').max(100, 'Grade cannot exceed 100'),
};

// Authentication schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z.object({
  username: commonValidations.username,
  email: commonValidations.email,
  password: commonValidations.password,
  confirmPassword: commonValidations.confirmPassword(),
  firstName: commonValidations.name,
  lastName: commonValidations.name,
  role: z.enum(['STUDENT', 'PROFESSOR', 'ADMIN'], {
    message: 'Please select a role',
  }),
  schoolId: z.string().min(1, 'Please select a school'),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
);

export const resetPasswordSchema = z.object({
  email: commonValidations.email,
});

export const newPasswordSchema = z.object({
  password: commonValidations.password,
  confirmPassword: commonValidations.confirmPassword(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
);

// User management schemas
export const userSchema = z.object({
  username: commonValidations.username,
  email: commonValidations.email,
  firstName: commonValidations.name,
  lastName: commonValidations.name,
  role: z.enum(['SUPERADMIN', 'ADMIN', 'PROFESSOR', 'STUDENT'], {
    message: 'Please select a role',
  }),
  schoolId: z.string().min(1, 'Please select a school'),
  phone: commonValidations.phone,
  address: z.string().max(255, 'Address must be less than 255 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  isActive: z.boolean().default(true),
  dateJoined: commonValidations.date.optional(),
});

export const createUserSchema = userSchema.extend({
  password: commonValidations.password,
  confirmPassword: commonValidations.confirmPassword(),
  sendWelcomeEmail: z.boolean().default(true),
  schoolId: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validate school is required for non-superadmin users
  if (data.role !== 'SUPERADMIN' && !data.schoolId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'School is required for non-superadmin users',
      path: ['schoolId'],
    });
  }
  
  // Validate passwords match
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });
  }
});

export const updateUserSchema = userSchema.partial().extend({
  id: z.string().min(1, 'User ID is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: commonValidations.password,
  confirmNewPassword: commonValidations.confirmPassword('newPassword'),
}).refine(
  (data) => data.newPassword === data.confirmNewPassword,
  {
    message: "New passwords don't match",
    path: ["confirmNewPassword"],
  }
);

// School management schemas
export const schoolSchema = z.object({
  name: z.string().min(1, 'School name is required').max(100, 'School name must be less than 100 characters'),
  address: z.string().min(1, 'Address is required').max(255, 'Address must be less than 255 characters'),
  phone: commonValidations.phone.refine(val => val !== '', { message: 'Phone number is required' }),
  email: commonValidations.email,
  website: commonValidations.url,
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  type: z.enum(['PUBLIC', 'PRIVATE', 'CHARTER'], {
    message: 'Please select a school type',
  }),
  grade_levels: z.array(z.string()).min(1, 'Please select at least one grade level'),
  capacity: commonValidations.positiveNumber.optional(),
  founded_year: z.number()
    .min(1800, 'Founded year must be after 1800')
    .max(new Date().getFullYear(), 'Founded year cannot be in the future')
    .optional(),
  isActive: z.boolean().default(true),
});

export const createSchoolSchema = schoolSchema;
export const updateSchoolSchema = schoolSchema.partial().extend({
  id: z.string().min(1, 'School ID is required'),
});

// Subject management schemas
export const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100, 'Subject name must be less than 100 characters'),
  code: z.string()
    .min(2, 'Subject code must be at least 2 characters')
    .max(10, 'Subject code must be less than 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Subject code must contain only uppercase letters and numbers'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  credits: commonValidations.positiveNumber.max(10, 'Credits cannot exceed 10'),
  department: z.string().min(1, 'Department is required').max(100, 'Department must be less than 100 characters'),
  prerequisites: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export const createSubjectSchema = subjectSchema;
export const updateSubjectSchema = subjectSchema.partial().extend({
  id: z.string().min(1, 'Subject ID is required'),
});

// Section management schemas
export const sectionSchema = z.object({
  name: z.string().min(1, 'Section name is required').max(50, 'Section name must be less than 50 characters'),
  subjectId: z.string().min(1, 'Please select a subject'),
  professorId: z.string().min(1, 'Please select a professor'),
  semester: z.enum(['FALL', 'SPRING', 'SUMMER'], {
    message: 'Please select a semester',
  }),
  year: z.number()
    .min(2020, 'Year must be 2020 or later')
    .max(2030, 'Year cannot exceed 2030'),
  capacity: commonValidations.positiveNumber.max(200, 'Capacity cannot exceed 200'),
  schedule: z.array(z.object({
    dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)'),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)'),
    room: z.string().max(50, 'Room must be less than 50 characters').optional(),
  })).min(1, 'Please add at least one schedule'),
  startDate: commonValidations.date,
  endDate: commonValidations.date,
  isActive: z.boolean().default(true),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

export const createSectionSchema = sectionSchema;
export const updateSectionSchema = sectionSchema.partial().extend({
  id: z.string().min(1, 'Section ID is required'),
});

// Assignment management schemas
export const assignmentSchema = z.object({
  title: z.string().min(1, 'Assignment title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
  sectionId: z.string().min(1, 'Please select a section'),
  dueDate: commonValidations.dateTime,
  maxPoints: commonValidations.positiveNumber.max(1000, 'Max points cannot exceed 1000'),
  type: z.enum(['HOMEWORK', 'QUIZ', 'EXAM', 'PROJECT', 'ESSAY'], {
    message: 'Please select an assignment type',
  }),
  submissionType: z.enum(['TEXT', 'FILE', 'BOTH'], {
    message: 'Please select a submission type',
  }),
  allowedFileTypes: z.array(z.string()).optional(),
  maxFileSize: commonValidations.positiveNumber.optional(),
  instructions: z.string().max(5000, 'Instructions must be less than 5000 characters').optional(),
  rubric: z.string().max(3000, 'Rubric must be less than 3000 characters').optional(),
  isPublished: z.boolean().default(false),
  allowLateSubmissions: z.boolean().default(false),
  latePenalty: commonValidations.nonNegativeNumber.max(100, 'Late penalty cannot exceed 100%').optional(),
});

export const createAssignmentSchema = assignmentSchema;
export const updateAssignmentSchema = assignmentSchema.partial().extend({
  id: z.string().min(1, 'Assignment ID is required'),
});

// Submission management schemas
export const submissionSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  textContent: z.string().max(10000, 'Text content must be less than 10000 characters').optional(),
  files: z.array(z.object({
    name: z.string().min(1, 'File name is required'),
    url: z.string().url('Invalid file URL'),
    size: commonValidations.positiveNumber,
    type: z.string().min(1, 'File type is required'),
  })).optional(),
  submittedAt: commonValidations.dateTime.optional(),
  isLate: z.boolean().default(false),
});

export const createSubmissionSchema = submissionSchema;
export const updateSubmissionSchema = submissionSchema.partial().extend({
  id: z.string().min(1, 'Submission ID is required'),
});

// Grading schemas
export const gradeSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
  score: commonValidations.grade,
  feedback: z.string().max(2000, 'Feedback must be less than 2000 characters').optional(),
  rubricScores: z.array(z.object({
    criteriaId: z.string().min(1, 'Criteria ID is required'),
    score: commonValidations.grade,
    comment: z.string().max(500, 'Comment must be less than 500 characters').optional(),
  })).optional(),
  gradedAt: commonValidations.dateTime.optional(),
  gradedBy: z.string().min(1, 'Grader ID is required'),
});

export const createGradeSchema = gradeSchema;
export const updateGradeSchema = gradeSchema.partial().extend({
  id: z.string().min(1, 'Grade ID is required'),
});

// Enrollment schemas
export const enrollmentSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  sectionId: z.string().min(1, 'Please select a section'),
  enrollmentDate: commonValidations.date.optional(),
  grade: z.enum(['A', 'B', 'C', 'D', 'F', 'INCOMPLETE', 'WITHDRAWN'], {
    message: 'Please select a final grade',
  }).optional(),
  isActive: z.boolean().default(true),
});

export const createEnrollmentSchema = enrollmentSchema;
export const updateEnrollmentSchema = enrollmentSchema.partial().extend({
  id: z.string().min(1, 'Enrollment ID is required'),
});

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  filters: z.record(z.string(), z.any()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: commonValidations.positiveNumber.default(1),
  limit: z.number().min(1).max(100).default(20),
});

// File upload schemas
export const fileUploadSchema = z.object({
  files: z.array(z.object({
    name: z.string().min(1, 'File name is required'),
    size: commonValidations.positiveNumber.max(50 * 1024 * 1024, 'File size cannot exceed 50MB'),
    type: z.string().min(1, 'File type is required'),
  })).min(1, 'Please select at least one file').max(10, 'Cannot upload more than 10 files at once'),
  uploadPath: z.string().min(1, 'Upload path is required'),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Contact/Support schemas
export const contactSchema = z.object({
  name: commonValidations.name,
  email: commonValidations.email,
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject must be less than 100 characters'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters'),
  category: z.enum(['TECHNICAL', 'BILLING', 'GENERAL', 'FEATURE_REQUEST'], {
    message: 'Please select a category',
  }),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

// Settings schemas
export const userSettingsSchema = z.object({
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    assignments: z.boolean().default(true),
    grades: z.boolean().default(true),
    announcements: z.boolean().default(true),
  }),
  privacy: z.object({
    showProfile: z.boolean().default(true),
    showEmail: z.boolean().default(false),
    showPhone: z.boolean().default(false),
  }),
  display: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    language: z.string().default('en'),
    timezone: z.string().default('UTC'),
  }),
});

// Type exports for TypeScript inference
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type SchoolFormData = z.infer<typeof schoolSchema>;
export type SubjectFormData = z.infer<typeof subjectSchema>;
export type SectionFormData = z.infer<typeof sectionSchema>;
export type AssignmentFormData = z.infer<typeof assignmentSchema>;
export type SubmissionFormData = z.infer<typeof submissionSchema>;
export type GradeFormData = z.infer<typeof gradeSchema>;
export type EnrollmentFormData = z.infer<typeof enrollmentSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type UserSettingsData = z.infer<typeof userSettingsSchema>;