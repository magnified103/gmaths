import { z } from 'zod';
import { createUser } from './authService';
import { csvUserSchema, CSVUserInput } from '../utils/validation';

/**
 * Interface for CSV user row data
 */
interface CSVUserRow {
  username: string;
  email: string;
  password: string;
}

/**
 * Interface for bulk upload error
 */
interface BulkUploadError {
  row: number;
  field: string;
  message: string;
  data: Record<string, any>;
}

/**
 * Interface for bulk upload result
 */
interface BulkUploadResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: BulkUploadError[];
}

/**
 * Parses CSV content into array of user objects.
 * @param csvContent - Raw CSV content as string.
 * @returns Array of parsed user objects.
 */
function parseCSVContent(csvContent: string): CSVUserRow[] {
  const lines = csvContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 2) {
    throw new Error('Tệp CSV phải có ít nhất 1 dòng dữ liệu (ngoài tiêu đề)');
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = headerLine
    .split(',')
    .map(header => header.trim().replace(/"/g, '').toLowerCase());

  // Validate required headers
  const requiredHeaders = ['username', 'email', 'password'];
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  
  if (missingHeaders.length > 0) {
    throw new Error(`Tệp CSV thiếu các cột bắt buộc: ${missingHeaders.join(', ')}`);
  }

  // Get header indices
  const usernameIndex = headers.indexOf('username');
  const emailIndex = headers.indexOf('email');
  const passwordIndex = headers.indexOf('password');

  // Parse data rows
  const users: CSVUserRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = parseCSVLine(line);

    if (values.length < Math.max(usernameIndex, emailIndex, passwordIndex) + 1) {
      throw new Error(`Dòng ${i + 1}: Không đủ cột dữ liệu`);
    }

    users.push({
      username: (values[usernameIndex] || '').trim(),
      email: (values[emailIndex] || '').trim(),
      password: (values[passwordIndex] || '').trim(),
    });
  }

  return users;
}

/**
 * Parses a single CSV line, handling quoted values.
 * @param line - CSV line to parse.
 * @returns Array of cell values.
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add final field
  values.push(current);

  return values;
}

/**
 * Validates a single user row against the schema.
 * @param user - User data to validate.
 * @param rowNumber - Row number for error reporting.
 * @returns Array of validation errors.
 */
function validateUserRow(user: CSVUserRow, rowNumber: number): BulkUploadError[] {
  const errors: BulkUploadError[] = [];

  try {
    csvUserSchema.parse(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      for (const issue of error.issues) {
        errors.push({
          row: rowNumber,
          field: issue.path.join('.'),
          message: issue.message,
          data: user,
        });
      }
    }
  }

  return errors;
}

/**
 * Processes bulk user import from CSV buffer.
 * @param csvBuffer - CSV file buffer.
 * @param overwrite - Whether to overwrite existing users.
 * @returns Bulk upload result with success/error counts.
 */
export async function processBulkUserImport(
  csvBuffer: Buffer,
  overwrite: boolean = false
): Promise<BulkUploadResult> {
  const result: BulkUploadResult = {
    success: false,
    totalRows: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
  };

  try {
    // Convert buffer to string
    const csvContent = csvBuffer.toString('utf-8');
    
    // Parse CSV content
    const users = parseCSVContent(csvContent);
    result.totalRows = users.length;

    // Validate all users first
    const validationErrors: BulkUploadError[] = [];
    const validUsers: CSVUserRow[] = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const rowNumber = i + 2; // +2 because row 1 is header and arrays are 0-indexed
      
      // Validate user data
      const userErrors = validateUserRow(user, rowNumber);
      if (userErrors.length > 0) {
        validationErrors.push(...userErrors);
      } else {
        validUsers.push(user);
      }
    }

    // If there are validation errors, return early
    if (validationErrors.length > 0) {
      result.errors = validationErrors;
      result.errorCount = validationErrors.length;
      return result;
    }

    // Process valid users
    for (let i = 0; i < validUsers.length; i++) {
      const user = validUsers[i];
      const rowNumber = i + 2;

      try {
        // Try to create the user with STUDENT role (security requirement)
        await createUser(user.username, user.email, user.password, ['student']);
        result.successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        
        // Handle specific error cases
        if (errorMessage.includes('already exists')) {
          if (overwrite) {
            // TODO: Implement user update logic for overwrite case
            // For now, treat as error since update functionality needs more consideration
            result.errors.push({
              row: rowNumber,
              field: 'user',
              message: 'Tính năng ghi đè người dùng chưa được triển khai',
              data: user,
            });
            result.errorCount++;
          } else {
            result.errors.push({
              row: rowNumber,
              field: 'user',
              message: `Người dùng đã tồn tại: ${errorMessage}`,
              data: user,
            });
            result.errorCount++;
          }
        } else {
          result.errors.push({
            row: rowNumber,
            field: 'user',
            message: `Lỗi tạo người dùng: ${errorMessage}`,
            data: user,
          });
          result.errorCount++;
        }
      }
    }

    // Determine overall success
    result.success = result.errorCount === 0;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
    result.errors.push({
      row: 0,
      field: 'file',
      message: `Lỗi xử lý tệp CSV: ${errorMessage}`,
      data: {},
    });
    result.errorCount = 1;
  }

  return result;
}

/**
 * Generates CSV template content for user import.
 * @returns CSV template as string.
 */
export function generateCSVTemplate(): string {
  const headers = ['username', 'email', 'password'];
  const sampleData = [
    ['nguyen.van.a', 'a.nguyen@example.com', 'Password123!'],
    ['tran.thi.b', 'b.tran@example.com', 'SecurePass456@'],
    ['le.minh.c', 'c.le@example.com', 'MyPassword789#'],
  ];

  // Create CSV content
  const lines = [headers.join(',')];
  for (const row of sampleData) {
    // Escape values that contain commas or quotes
    const escapedRow = row.map(value => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    lines.push(escapedRow.join(','));
  }

  return lines.join('\n');
}
