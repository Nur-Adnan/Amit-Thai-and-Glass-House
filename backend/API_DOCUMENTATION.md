# API Documentation

## Authentication Endpoints

### Login
- **POST** `/api/auth/login`
- **Access**: Public
- **Body**: 
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### Register User (Owner Only)
- **POST** `/api/auth/register`
- **Access**: Private (Owner only)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "password": "password123",
    "role": "manager" // or "accountant"
  }
  ```

### Get Current User
- **GET** `/api/auth/me`
- **Access**: Private
- **Headers**: `Authorization: Bearer <token>`

### Update User Details
- **PUT** `/api/auth/updatedetails`
- **Access**: Private
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "New Name",
    "email": "newemail@example.com"
  }
  ```

### Update Password
- **PUT** `/api/auth/updatepassword`
- **Access**: Private
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "currentPassword": "oldpassword",
    "newPassword": "newpassword123"
  }
  ```

### Logout
- **GET** `/api/auth/logout`
- **Access**: Private
- **Headers**: `Authorization: Bearer <token>`

## User Management Endpoints

### Get All Users
- **GET** `/api/users`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`

### Get Single User
- **GET** `/api/users/:id`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`

### Update User
- **PUT** `/api/users/:id`
- **Access**: Private (Owner only)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "Updated Name",
    "email": "updated@example.com",
    "role": "manager"
  }
  ```

### Delete User
- **DELETE** `/api/users/:id`
- **Access**: Private (Owner only)
- **Headers**: `Authorization: Bearer <token>`

### Deactivate User
- **PUT** `/api/users/:id/deactivate`
- **Access**: Private (Owner only)
- **Headers**: `Authorization: Bearer <token>`

### Activate User
- **PUT** `/api/users/:id/activate`
- **Access**: Private (Owner only)
- **Headers**: `Authorization: Bearer <token>`

## Role Hierarchy

1. **Owner**: Full access to all endpoints
2. **Manager**: Can view users, access protected routes
3. **Accountant**: Basic access to protected routes

## Default Owner Account

Run `npm run seed:owner` to create the default owner:
- **Email**: owner@company.com
- **Password**: password123
- **Role**: owner

**Important**: Change the password after first login!

## Error Responses

All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Success Responses

All endpoints return consistent success responses:
```json
{
  "success": true,
  "message": "Success message",
  "data": { /* response data */ }
}
```

## Product Management Endpoints

### Get All Products
- **GET** `/api/products`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `category`: Filter by category (Thai/Glass)
  - `isActive`: Filter by active status (true/false)
  - `search`: Search by product name
  - `sortBy`: Sort field (default: createdAt)
  - `sortOrder`: Sort order (asc/desc, default: desc)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)

### Get Single Product
- **GET** `/api/products/:id`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`

### Create Product
- **POST** `/api/products`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "Product Name",
    "category": "Thai", // or "Glass"
    "purchasePrice": 100,
    "sellingPrice": 150,
    "stockQuantity": 50,
    "unit": "sqft", // sqft, piece, kg, meter
    "description": "Product description (optional)"
  }
  ```

### Update Product
- **PUT** `/api/products/:id`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Same as create product

### Delete Product
- **DELETE** `/api/products/:id`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`

### Update Stock
- **PUT** `/api/products/:id/stock`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "quantity": 10,
    "operation": "add" // or "subtract"
  }
  ```

### Get Low Stock Products
- **GET** `/api/products/low-stock`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `threshold`: Stock threshold (default: 10)

### Get Product Statistics
- **GET** `/api/products/stats`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`

## Product Schema Validation

- **Name**: Required, max 100 characters
- **Category**: Required, must be "Thai" or "Glass"
- **Purchase Price**: Required, cannot be negative
- **Selling Price**: Required, cannot be negative, cannot be less than purchase price
- **Stock Quantity**: Required, cannot be negative, must be integer
- **Unit**: Required, must be "sqft", "piece", "kg", or "meter"
- **Description**: Optional, max 500 characters

## Product Features

- **Profit Calculation**: Automatic profit margin and amount calculation
- **Stock Management**: Add/subtract stock with validation
- **Low Stock Alerts**: Identify products below threshold
- **Category Statistics**: Aggregate data by category
- **Search and Filtering**: Advanced query capabilities
- **Audit Trail**: Track who created/updated products

## Seed Data

Run `npm run seed:products` to create sample products:
- Premium Thai Marble - White
- Thai Granite - Black
- Tempered Glass Panel - 8mm
- Laminated Glass - 10mm
- Thai Limestone - Beige
- Frosted Glass - 6mm
## Calculator Endpoints

### Get All Calculator Configurations
- **GET** `/api/calculator/config`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`

### Get Single Calculator Configuration
- **GET** `/api/calculator/config/:materialType`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: materialType (Thai/Glass)

### Save Calculator Configuration
- **POST** `/api/calculator/config`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "materialType": "Thai", // or "Glass"
    "pricePerSqFt": 125.50
  }
  ```

### Calculate Measurement
- **POST** `/api/calculator/calculate`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`
- **Body** (Option 1 - Decimal input):
  ```json
  {
    "materialType": "Thai",
    "length": 10.5,
    "width": 8.25,
    "customPricePerSqFt": 150 // optional
  }
  ```
- **Body** (Option 2 - Feet and inches input):
  ```json
  {
    "materialType": "Glass",
    "lengthFeet": 12,
    "lengthInches": 6,
    "widthFeet": 8,
    "widthInches": 3,
    "customPricePerSqFt": 100 // optional
  }
  ```

### Bulk Calculate
- **POST** `/api/calculator/bulk-calculate`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "calculations": [
      {"materialType": "Thai", "length": 10, "width": 8},
      {"materialType": "Glass", "lengthFeet": 15, "lengthInches": 6, "widthFeet": 10, "widthInches": 0}
    ]
  }
  ```

### Delete Calculator Configuration
- **DELETE** `/api/calculator/config/:materialType`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`

## Calculator Logic

### Calculation Formula
1. **Convert feet and inches to total feet**: `totalFeet = feet + (inches / 12)`
2. **Calculate area**: `area = length × width`
3. **Calculate total price**: `totalPrice = area × pricePerSqFt`

### Input Options
- **Decimal input**: Provide `length` and `width` as decimal numbers
- **Feet/inches input**: Provide `lengthFeet`, `lengthInches`, `widthFeet`, `widthInches`
- **Custom pricing**: Override configuration price with `customPricePerSqFt`

### Response Format
```json
{
  "success": true,
  "data": {
    "input": {
      "materialType": "Thai",
      "dimensions": {
        "length": 12.5,
        "width": 8.25
      },
      "pricePerSqFt": 135.75,
      "customPrice": false
    },
    "calculation": {
      "area": 103.125,
      "pricePerSqFt": 135.75,
      "totalPrice": 14000.44
    },
    "breakdown": {
      "formula": "Area = Length × Width",
      "areaCalculation": "12.50 × 8.25 = 103.1250 sq ft",
      "priceCalculation": "103.1250 × $135.75 = $14000.44"
    }
  }
}
```

## Calculator Configuration Schema

- **materialType**: Required, must be "Thai" or "Glass", unique
- **pricePerSqFt**: Required, cannot be negative
- **isActive**: Boolean, default true
- **createdBy/updatedBy**: User references for audit trail

## Seed Data

Run `npm run seed:calculator` to create default configurations:
- Thai: $125.50 per sq ft
- Glass: $95.75 per sq ft
## Invoice Management Endpoints

### Get All Invoices
- **GET** `/api/invoices`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `status`: Filter by status (paid/partial/due)
  - `customerName`: Search by customer name
  - `startDate`: Filter from date (YYYY-MM-DD)
  - `endDate`: Filter to date (YYYY-MM-DD)
  - `sortBy`: Sort field (default: createdAt)
  - `sortOrder`: Sort order (asc/desc, default: desc)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)

### Get Single Invoice
- **GET** `/api/invoices/:id`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`

### Create Invoice
- **POST** `/api/invoices`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "customerName": "Customer Name",
    "customerPhone": "123-456-7890",
    "customerAddress": "Customer Address",
    "items": [
      {
        "product": "product_id",
        "quantity": 10,
        "unitPrice": 150 // optional, uses product selling price if not provided
      }
    ],
    "discount": 100,
    "discountType": "amount", // or "percentage"
    "paidAmount": 500,
    "paymentMethod": "cash", // cash, card, bank_transfer, cheque, mixed
    "notes": "Additional notes"
  }
  ```

### Update Payment
- **PUT** `/api/invoices/:id/payment`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "paidAmount": 1000,
    "paymentMethod": "card"
  }
  ```

### Cancel Invoice
- **PUT** `/api/invoices/:id/cancel`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Note**: Restores stock quantities and marks invoice as inactive

### Get Invoice Statistics
- **GET** `/api/invoices/stats`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `startDate`: Filter from date
  - `endDate`: Filter to date

### Get Pending Payments
- **GET** `/api/invoices/pending`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`

### Search Invoices
- **GET** `/api/invoices/search`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `q`: Search query (invoice number, customer name, or phone)

## Invoice Schema Features

### Invoice Number Format
- **Format**: INV-YYYYMM-XXXX
- **Example**: INV-202601-0001
- **Auto-generated** with sequential numbering per month

### Payment Status Logic
- **Due**: paidAmount = 0
- **Partial**: 0 < paidAmount < grandTotal
- **Paid**: paidAmount >= grandTotal

### Automatic Calculations
- **Subtotal**: Sum of all item totals
- **Grand Total**: Subtotal - discount
- **Due Amount**: Grand Total - Paid Amount
- **Status**: Automatically calculated based on payment

### Stock Management
- **Automatic Deduction**: Stock reduced when invoice created
- **Stock Validation**: Prevents selling if insufficient stock
- **Stock Restoration**: Stock restored when invoice cancelled
- **Transaction Safety**: Uses MongoDB transactions for data consistency

### Invoice Items
- **Product Reference**: Links to product with current details
- **Unit Price**: Can override product selling price
- **Total Price**: Automatically calculated (quantity × unit price)
- **Stock Check**: Validates availability before creation

## Business Logic

### Stock Deduction Process
1. Check stock availability for all items
2. Validate sufficient quantities
3. Create invoice with calculated totals
4. Deduct stock quantities atomically
5. Update product updatedBy fields

### Payment Status Updates
- Status automatically recalculated on payment updates
- Due amount updated based on payments
- Prevents overpayment (caps at grand total)

### Error Handling
- **Insufficient Stock**: Clear error messages with available quantities
- **Invalid Products**: Validation for active products only
- **Transaction Rollback**: Automatic rollback on any failure
- **Concurrent Safety**: MongoDB sessions prevent race conditions

## Seed Data

Run `npm run seed:invoices` to create sample invoices (requires existing products and users)
## Invoice Payment Management Endpoints

### Add Payment to Invoice
- **POST** `/api/invoices/:invoiceId/payments`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "paymentAmount": 1000,
    "paymentMethod": "card", // cash, card, bank_transfer, cheque, upi, other
    "referenceNumber": "TXN-123456",
    "notes": "Partial payment received",
    "paymentDate": "2026-01-02" // optional, defaults to current date
  }
  ```

### Get Payment History for Invoice
- **GET** `/api/invoices/:invoiceId/payments`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)

### Get Single Payment Details
- **GET** `/api/payments/:paymentId`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`

### Reverse Payment
- **PUT** `/api/payments/:paymentId/reverse`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "reversalReason": "Customer requested refund"
  }
  ```

### Get All Payments
- **GET** `/api/payments`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `startDate`: Filter from date (YYYY-MM-DD)
  - `endDate`: Filter to date (YYYY-MM-DD)
  - `paymentMethod`: Filter by payment method
  - `invoiceNo`: Search by invoice number
  - `customerName`: Search by customer name
  - `sortBy`: Sort field (default: createdAt)
  - `sortOrder`: Sort order (asc/desc, default: desc)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)

### Get Payment Statistics
- **GET** `/api/payments/stats`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `startDate`: Filter from date
  - `endDate`: Filter to date

## InvoicePayment Schema Features

### Payment Tracking
- **Payment Amount**: Individual payment amount with validation
- **Payment Method**: cash, card, bank_transfer, cheque, upi, other
- **Reference Number**: Transaction reference for tracking
- **Payment Date**: When payment was received (defaults to current date)
- **Notes**: Additional payment details

### Status Transitions
- **Previous Status**: Invoice status before payment
- **New Status**: Invoice status after payment
- **Previous Paid Amount**: Running total before payment
- **New Paid Amount**: Running total after payment
- **Remaining Due Amount**: Amount still owed after payment

### Payment Validation
- **Amount Validation**: Cannot exceed remaining due amount
- **Status Validation**: Cannot add payments to fully paid invoices
- **Reversal Support**: Payments can be reversed with reason tracking

### Payment Reversal
- **Reversal Tracking**: isReversed flag with timestamp
- **Reversal Reason**: Required reason for audit trail
- **Reversed By**: User who performed the reversal
- **Invoice Updates**: Automatically updates invoice amounts and status

## Payment Business Logic

### Automatic Status Updates
- **Due → Partial**: When first payment is made
- **Partial → Paid**: When remaining amount is fully paid
- **Paid → Partial**: When payment is reversed from fully paid invoice
- **Partial → Due**: When all payments are reversed

### Payment Method Tracking
- **Single Method**: Uses the payment method if all payments use same method
- **Mixed Methods**: Automatically set to "mixed" when different methods used
- **Method Recalculation**: Updates when payments are reversed

### Transaction Safety
- **Atomic Operations**: Payment creation and invoice updates in single transaction
- **Rollback Support**: Automatic rollback on any failure
- **Concurrent Safety**: MongoDB sessions prevent race conditions

### Payment History
- **Complete Audit Trail**: All payment activities tracked
- **Status Transitions**: Before/after states recorded
- **User Tracking**: Who made payments and reversals
- **Filtering**: Search by date, method, invoice, customer

### Validation Rules
- **Positive Amounts**: Payment amount must be greater than 0
- **Due Amount Limit**: Cannot pay more than remaining due amount
- **Active Invoice**: Cannot pay cancelled invoices
- **Paid Invoice**: Cannot add payments to fully paid invoices
- **Reversal Validation**: Cannot reverse already reversed payments

## Payment Statistics

### Overall Statistics
- Total payments count and amount
- Average, minimum, and maximum payment amounts
- Payment trends over time

### Payment Method Breakdown
- Total amount and count by payment method
- Average payment amount per method
- Method popularity analysis

### Daily Trends
- Payment amounts by date
- Payment frequency patterns
- Revenue tracking over time

## Seed Data

Run `npm run seed:payments` to create sample payments (requires existing invoices with due amounts)
## Employee Management Endpoints

### Get All Employees
- **GET** `/api/employees`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `department`: Filter by department (Administration, Sales, Production, Warehouse, Finance, HR)
  - `employmentType`: Filter by type (full-time, part-time, contract, intern)
  - `isActive`: Filter by active status (true/false)
  - `search`: Search by name, employee ID, email, or position
  - `sortBy`: Sort field (default: createdAt)
  - `sortOrder`: Sort order (asc/desc, default: desc)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)

### Get Single Employee
- **GET** `/api/employees/:id`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`

### Create Employee
- **POST** `/api/employees`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "John Smith",
    "email": "john.smith@company.com",
    "phone": "+1-555-0101",
    "address": "123 Main St, City, State 12345",
    "position": "Sales Manager",
    "department": "Sales",
    "monthlySalary": 45000,
    "employmentType": "full-time",
    "bankDetails": {
      "accountNumber": "1234567890",
      "bankName": "ABC Bank",
      "ifscCode": "ABC0001234"
    },
    "notes": "Additional notes"
  }
  ```

### Update Employee
- **PUT** `/api/employees/:id`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Same as create employee

### Deactivate Employee
- **PUT** `/api/employees/:id/deactivate`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "terminationDate": "2026-01-31",
    "terminationReason": "Resignation"
  }
  ```

### Activate Employee
- **PUT** `/api/employees/:id/activate`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`

### Delete Employee
- **DELETE** `/api/employees/:id`
- **Access**: Private (Owner only)
- **Headers**: `Authorization: Bearer <token>`

### Get Employee Statistics
- **GET** `/api/employees/stats`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`

## Salary Payment Management Endpoints

### Get All Salary Payments
- **GET** `/api/salary-payments`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `month`: Filter by payment month (1-12)
  - `year`: Filter by payment year
  - `status`: Filter by status (due/paid)
  - `department`: Filter by employee department
  - `employeeId`: Filter by specific employee ID
  - `sortBy`: Sort field (default: createdAt)
  - `sortOrder`: Sort order (asc/desc, default: desc)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)

### Get Single Salary Payment
- **GET** `/api/salary-payments/:id`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`

### Create Salary Payment
- **POST** `/api/salary-payments`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "employeeId": "EMP-0001",
    "paymentMonth": 1,
    "paymentYear": 2026,
    "allowances": {
      "hra": 5000,
      "transport": 2000,
      "medical": 1500,
      "other": 0
    },
    "deductions": {
      "pf": 4500,
      "esi": 0,
      "tax": 3000,
      "advance": 0,
      "other": 0
    },
    "overtime": {
      "hours": 10,
      "rate": 500
    },
    "actualWorkingDays": 30,
    "notes": "January 2026 salary"
  }
  ```

### Mark Salary as Paid
- **PUT** `/api/salary-payments/:id/pay`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "paymentDate": "2026-01-31",
    "paymentMethod": "bank_transfer",
    "referenceNumber": "SAL-JAN-2026-001"
  }
  ```

### Update Salary Payment
- **PUT** `/api/salary-payments/:id`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Same as create salary payment
- **Note**: Cannot update paid salaries

### Delete Salary Payment
- **DELETE** `/api/salary-payments/:id`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Note**: Cannot delete paid salaries

### Generate Monthly Salaries
- **POST** `/api/salary-payments/generate`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "paymentMonth": 2,
    "paymentYear": 2026
  }
  ```

### Get Salary Statistics
- **GET** `/api/salary-payments/stats`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `month`: Single month stats
  - `year`: Single year stats
  - `startMonth`: Range start month
  - `startYear`: Range start year
  - `endMonth`: Range end month
  - `endYear`: Range end year

### Get Due Salaries
- **GET** `/api/salary-payments/due`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`

## Employee Schema Features

### Employee ID Generation
- **Format**: EMP-XXXX (e.g., EMP-0001)
- **Auto-generated** with sequential numbering
- **Unique constraint** to prevent duplicates

### Employee Information
- **Personal Details**: Name, email, phone, address
- **Employment Details**: Position, department, employment type
- **Salary Information**: Monthly salary amount
- **Bank Details**: Account number, bank name, IFSC code
- **Status Tracking**: Active/inactive with termination details

### Employment Duration
- **Virtual Field**: Automatically calculated from joining date
- **Returns**: Years, months, and total days of employment
- **Dynamic**: Updates based on current date or termination date

## SalaryPayment Schema Features

### Salary Components
- **Base Salary**: Employee's monthly salary
- **Allowances**: HRA, transport, medical, other
- **Deductions**: PF, ESI, tax, advance, other
- **Overtime**: Hours, rate, and calculated amount
- **Working Days**: Standard and actual working days

### Automatic Calculations
- **Gross Salary**: Base + Allowances + Overtime
- **Total Deductions**: Sum of all deduction components
- **Net Salary**: Gross - Deductions (minimum 0)
- **Pro-rata Calculation**: Adjusts for actual working days

### Payment Tracking
- **Status**: Due/Paid with automatic transitions
- **Payment Details**: Date, method, reference number
- **Expense Recording**: Automatic expense categorization
- **Audit Trail**: Complete user and timestamp tracking

### Validation Rules
- **Unique Constraint**: One salary per employee per month/year
- **Positive Values**: All amounts must be non-negative
- **Date Validation**: Month (1-12), Year (2020-2050)
- **Working Days**: Maximum 31 days per month

## Business Logic

### Salary Calculation Process
1. **Base Salary**: From employee's monthly salary
2. **Add Allowances**: HRA + Transport + Medical + Other
3. **Add Overtime**: Hours × Rate
4. **Calculate Gross**: Base + Allowances + Overtime
5. **Subtract Deductions**: PF + ESI + Tax + Advance + Other
6. **Calculate Net**: Gross - Deductions (minimum 0)
7. **Pro-rata Adjustment**: If actual working days differ

### Expense Tracking
- **Auto-categorization**: Marked as "Salary Expense"
- **Expense Recording**: Flag set when salary marked as paid
- **Integration Ready**: Can be integrated with expense management

### Payment Status Management
- **Due**: Default status when salary created
- **Paid**: Status when payment is processed
- **Expense Recorded**: Automatic flag for accounting integration

## Seed Data

Run `npm run seed:employees` to create sample employees:
- EMP-0001: John Smith (Sales Manager) - $45,000
- EMP-0002: Sarah Johnson (Production Supervisor) - $38,000
- EMP-0003: Mike Davis (Warehouse Assistant) - $25,000
- EMP-0004: Lisa Wilson (Accountant) - $35,000
- EMP-0005: Tom Brown (HR Assistant) - $28,000
## Expense Management Endpoints

### Get All Expenses
- **GET** `/api/expenses`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `category`: Filter by category (Salary Expense, Office Rent, Utilities, Equipment, Marketing, Travel, Supplies, Maintenance, Insurance, Professional Services, Other)
  - `sourceType`: Filter by source type (manual, salary, stock_purchase, invoice)
  - `status`: Filter by status (pending, approved, rejected)
  - `startDate`: Filter from date (YYYY-MM-DD)
  - `endDate`: Filter to date (YYYY-MM-DD)
  - `search`: Search by title, expense ID, description, or vendor name
  - `sortBy`: Sort field (default: createdAt)
  - `sortOrder`: Sort order (asc/desc, default: desc)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)

### Get Single Expense
- **GET** `/api/expenses/:id`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`

### Create Expense
- **POST** `/api/expenses`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "Office Rent - January 2026",
    "description": "Monthly office rent payment",
    "amount": 25000,
    "category": "Office Rent",
    "subcategory": "Main Office",
    "expenseDate": "2026-01-01",
    "paymentMethod": "bank_transfer",
    "referenceNumber": "RENT-JAN-2026",
    "vendor": {
      "name": "ABC Properties",
      "contact": "+1-555-0101",
      "address": "123 Business District, City"
    },
    "taxDetails": {
      "isTaxable": true,
      "taxRate": 18
    },
    "notes": "Additional notes"
  }
  ```

### Update Expense
- **PUT** `/api/expenses/:id`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Same as create expense
- **Note**: Cannot update approved expenses (except owner)

### Delete Expense
- **DELETE** `/api/expenses/:id`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Note**: Cannot delete auto-generated expenses

### Approve Expense
- **PUT** `/api/expenses/:id/approve`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`

### Reject Expense
- **PUT** `/api/expenses/:id/reject`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "rejectionReason": "Insufficient documentation provided"
  }
  ```

### Get Expense Statistics
- **GET** `/api/expenses/stats`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `startDate`: Filter from date
  - `endDate`: Filter to date

### Auto-Generate Expense from Salary
- **POST** `/api/expenses/auto-generate/salary/:salaryPaymentId`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Note**: Automatically creates expense when salary is marked as paid

## Investment Management Endpoints

### Get All Investments
- **GET** `/api/investments`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `investmentType`: Filter by type (Stock Purchase, Equipment, Machinery, Property, Technology, Research & Development, Marketing Campaign, Infrastructure, Training, Other)
  - `category`: Filter by category (Capital Expenditure, Operational Investment, Strategic Investment)
  - `sourceType`: Filter by source type (manual, stock_purchase, equipment_purchase)
  - `status`: Filter by status (pending, approved, rejected, completed)
  - `startDate`: Filter from date (YYYY-MM-DD)
  - `endDate`: Filter to date (YYYY-MM-DD)
  - `search`: Search by title, investment ID, description, or vendor name
  - `sortBy`: Sort field (default: createdAt)
  - `sortOrder`: Sort order (asc/desc, default: desc)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)

### Get Single Investment
- **GET** `/api/investments/:id`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`

### Create Investment
- **POST** `/api/investments`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "New Cutting Machine Purchase",
    "description": "High-precision cutting machine for Thai marble processing",
    "amount": 150000,
    "investmentType": "Machinery",
    "category": "Capital Expenditure",
    "investmentDate": "2026-01-01",
    "expectedROI": {
      "percentage": 25,
      "timeframe": "annually",
      "description": "Expected to increase production capacity by 40%"
    },
    "paymentMethod": "bank_transfer",
    "referenceNumber": "MACH-2026-001",
    "vendor": {
      "name": "Industrial Machinery Corp",
      "contact": "+1-555-1001",
      "address": "123 Industrial Ave, Manufacturing District"
    },
    "depreciation": {
      "method": "straight-line",
      "usefulLife": 10,
      "salvageValue": 15000
    },
    "notes": "Additional notes"
  }
  ```

### Update Investment
- **PUT** `/api/investments/:id`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Same as create investment
- **Note**: Cannot update completed investments (except owner)

### Delete Investment
- **DELETE** `/api/investments/:id`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Note**: Cannot delete auto-generated investments

### Approve Investment
- **PUT** `/api/investments/:id/approve`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`

### Reject Investment
- **PUT** `/api/investments/:id/reject`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "rejectionReason": "Budget constraints for this quarter"
  }
  ```

### Complete Investment
- **PUT** `/api/investments/:id/complete`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Note**: Marks investment as completed

### Update Investment ROI
- **PUT** `/api/investments/:id/roi`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "roiAmount": 165000,
    "roiPercentage": 10
  }
  ```

### Get Investment Statistics
- **GET** `/api/investments/stats`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `startDate`: Filter from date
  - `endDate`: Filter to date

### Auto-Generate Investment from Stock Purchase
- **POST** `/api/investments/auto-generate/stock/:productId`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "quantity": 100,
    "purchasePrice": 125.50
  }
  ```

## Expense Schema Features

### Expense ID Generation
- **Format**: EXP-YYYYMM-XXXX (e.g., EXP-202601-0001)
- **Auto-generated** with sequential numbering per month

### Expense Categories
- Salary Expense (auto-generated from salary payments)
- Office Rent
- Utilities
- Equipment
- Marketing
- Travel
- Supplies
- Maintenance
- Insurance
- Professional Services
- Other

### Auto-Generation Support
- **Salary Expenses**: Automatically created when salary payments are marked as paid
- **Source Tracking**: Links to original salary payment with audit trail
- **Approval Workflow**: Pending → Approved → Rejected status flow

### Tax Calculation
- **Automatic Tax Calculation**: Tax amount calculated based on rate
- **Tax Details**: Taxable flag, tax rate, and calculated tax amount
- **Total Amount**: Includes base amount plus tax

### Vendor Information
- **Vendor Details**: Name, contact, and address
- **Reference Numbers**: Transaction references for tracking
- **Payment Methods**: cash, bank_transfer, card, cheque, upi, other

## Investment Schema Features

### Investment ID Generation
- **Format**: INV-YYYYMM-XXXX (e.g., INV-202601-0001)
- **Auto-generated** with sequential numbering per month

### Investment Types
- Stock Purchase (auto-generated from stock purchases)
- Equipment
- Machinery
- Property
- Technology
- Research & Development
- Marketing Campaign
- Infrastructure
- Training
- Other

### Investment Categories
- **Capital Expenditure**: Long-term assets and infrastructure
- **Operational Investment**: Day-to-day operational improvements
- **Strategic Investment**: Long-term strategic initiatives

### ROI Tracking
- **Expected ROI**: Percentage, timeframe, and description
- **Actual ROI**: Real performance tracking with amounts and percentages
- **ROI Updates**: Track performance over time with timestamps

### Depreciation Support
- **Depreciation Methods**: Straight-line, declining-balance, or none
- **Asset Tracking**: Useful life, salvage value, and annual depreciation
- **Current Value**: Calculated based on depreciation method

### Auto-Generation Support
- **Stock Purchase Investments**: Automatically created for inventory purchases
- **Source Tracking**: Links to original product purchase with audit trail
- **Approval Workflow**: Pending → Approved → Completed → Rejected status flow

## Business Logic Integration

### Expense Auto-Generation
- **Salary Payment Integration**: Expenses automatically created when salaries are paid
- **Expense Categorization**: Auto-categorized as "Salary Expense"
- **Audit Trail**: Complete tracking of auto-generated vs manual expenses

### Investment Auto-Generation
- **Stock Purchase Integration**: Investments created for significant stock purchases
- **Investment Categorization**: Auto-categorized as "Stock Purchase" type
- **ROI Tracking**: Framework for tracking investment performance

### Date-wise Filtering
- **Flexible Date Ranges**: Filter by single date, date range, or specific periods
- **Monthly/Yearly Views**: Aggregate data by time periods
- **Trend Analysis**: Track expenses and investments over time

### Approval Workflows
- **Multi-level Approval**: Pending → Approved/Rejected status flow
- **Role-based Access**: Different permissions for different user roles
- **Audit Trail**: Complete history of approvals and rejections

## Seed Data

Run the following commands to create sample data:

### Create Sample Expenses
```bash
npm run seed:expenses
```
Creates 8 sample expenses including:
- Office rent, utilities, marketing campaigns
- Equipment maintenance, insurance premiums
- Professional services, travel expenses
- Various payment methods and tax scenarios

### Create Sample Investments
```bash
npm run seed:investments
```
Creates 8 sample investments including:
- Machinery purchases, warehouse expansion
- Technology implementations, training programs
- Quality control equipment, marketing campaigns
- R&D lab setup, delivery vehicle fleet
- Various ROI scenarios and depreciation methods

**Note**: Requires existing owner user. Run `npm run seed:owner` first if needed.
## Profit Analytics Endpoints

### Calculate Daily Profit
- **POST** `/api/profit/daily`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "date": "2026-01-03"
  }
  ```

### Calculate Monthly Profit
- **POST** `/api/profit/monthly`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "month": 1,
    "year": 2026
  }
  ```

### Calculate Product-wise Profit
- **POST** `/api/profit/product-wise`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  }
  ```

### Get All Profit Analyses
- **GET** `/api/profit/analyses`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `analysisType`: Filter by type (daily, monthly, product-wise, custom-period)
  - `startDate`: Filter from date (YYYY-MM-DD)
  - `endDate`: Filter to date (YYYY-MM-DD)
  - `sortBy`: Sort field (default: createdAt)
  - `sortOrder`: Sort order (asc/desc, default: desc)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)

### Get Single Profit Analysis
- **GET** `/api/profit/analyses/:id`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`

### Get Profit Trends
- **GET** `/api/profit/trends`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `startDate`: Start date (required, YYYY-MM-DD)
  - `endDate`: End date (required, YYYY-MM-DD)
  - `groupBy`: Grouping method (daily/monthly, default: daily)

### Get Top Performing Products
- **GET** `/api/profit/top-products`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `startDate`: Start date (required, YYYY-MM-DD)
  - `endDate`: End date (required, YYYY-MM-DD)
  - `limit`: Number of products to return (default: 10)

### Get Profit Dashboard
- **GET** `/api/profit/dashboard`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `period`: Time period (today, current-month, last-month, current-year, default: current-month)

### Delete Profit Analysis
- **DELETE** `/api/profit/analyses/:id`
- **Access**: Private (Owner only)
- **Headers**: `Authorization: Bearer <token>`

## Profit Calculation Logic

### Core Formula
```
Profit = Total Sales - Product Costs - Salary Expenses - Other Expenses
Profit Margin (%) = (Profit / Total Sales) × 100
```

### Component Breakdown

#### Total Sales (Revenue)
- **Source**: Paid and partially paid invoices
- **Calculation**: Sum of `paidAmount` from invoices
- **Period**: Based on invoice creation date
- **Status Filter**: Only 'paid' and 'partial' status invoices

#### Product Costs (COGS)
- **Source**: Purchase price of sold products
- **Calculation**: `Quantity Sold × Product Purchase Price`
- **Data Source**: Invoice items linked to product purchase prices
- **Period**: Based on invoice creation date

#### Salary Expenses
- **Source**: Approved expenses with category 'Salary Expense'
- **Calculation**: Sum of expense amounts
- **Auto-Generated**: From salary payments marked as paid
- **Period**: Based on expense date

#### Other Expenses
- **Source**: All approved expenses except 'Salary Expense'
- **Categories**: Office Rent, Utilities, Equipment, Marketing, Travel, etc.
- **Calculation**: Sum of expense amounts
- **Period**: Based on expense date

### Analysis Types

#### Daily Profit Analysis
- **Period**: Single day (00:00:00 to 23:59:59)
- **Use Case**: Daily performance tracking
- **Frequency**: Can be run multiple times per day
- **Data Points**: Revenue, costs, profit, margin for the specific date

#### Monthly Profit Analysis
- **Period**: Full calendar month
- **Use Case**: Monthly performance review
- **Frequency**: Typically run at month-end
- **Additional Metrics**: Invoice count, average order value

#### Product-wise Profit Analysis
- **Period**: Custom date range
- **Use Case**: Product performance evaluation
- **Breakdown**: Individual product profit and margin
- **Sorting**: By profit amount (highest first)
- **Metrics**: Quantity sold, revenue, cost, profit, margin per product

### Profit Analytics Schema

#### Analysis ID Format
- **Format**: PROFIT-YYYYMM-XXXX (e.g., PROFIT-202601-0001)
- **Auto-generated** with sequential numbering per month

#### Revenue Components
```json
{
  "totalSales": 15000.00,
  "invoiceCount": 25,
  "averageOrderValue": 600.00
}
```

#### Cost Components
```json
{
  "productCosts": 8500.00,
  "salaryExpenses": 3200.00,
  "otherExpenses": 1800.00,
  "totalCosts": 13500.00
}
```

#### Profit Calculations
```json
{
  "grossProfit": 6500.00,
  "netProfit": 1500.00,
  "profitMargin": 10.00
}
```

#### Product Breakdown (Product-wise Analysis)
```json
{
  "productBreakdown": [
    {
      "product": "product_id",
      "productName": "Premium Thai Marble",
      "quantitySold": 50,
      "revenue": 7500.00,
      "cost": 5000.00,
      "profit": 2500.00,
      "profitMargin": 33.33
    }
  ]
}
```

### Dashboard Metrics

#### Summary Statistics
- **Total Sales**: Revenue for the period
- **Total Costs**: All expenses for the period
- **Total Profit**: Net profit calculation
- **Profit Margin**: Overall profitability percentage
- **Profitability Rate**: Percentage of profitable periods

#### Trend Analysis
- **Recent Trends**: Last 7 periods of data
- **Comparison**: Period-over-period changes
- **Visualization Data**: Ready for charts and graphs

#### Top Products
- **Top 5 Products**: By profit amount
- **Performance Metrics**: Revenue, profit, margin per product
- **Quantity Analysis**: Units sold per product

### Business Intelligence Features

#### Profit Status Classification
- **Profitable**: Net profit > 0
- **Break-even**: Net profit = 0
- **Loss**: Net profit < 0

#### Cost Breakdown Percentages
- **Product Costs**: Percentage of total costs
- **Salary Expenses**: Percentage of total costs
- **Other Expenses**: Percentage of total costs

#### Performance Indicators
- **Gross Profit Margin**: (Revenue - Product Costs) / Revenue
- **Net Profit Margin**: (Revenue - Total Costs) / Revenue
- **Average Order Value**: Total Sales / Invoice Count

### Data Validation and Accuracy

#### Data Sources Validation
- **Invoice Validation**: Only active, paid/partial invoices
- **Expense Validation**: Only approved expenses
- **Product Validation**: Current purchase prices used
- **Date Validation**: Proper period filtering

#### Calculation Accuracy
- **Decimal Precision**: 2 decimal places for monetary values
- **Percentage Precision**: 2 decimal places for percentages
- **Rounding**: Consistent rounding rules applied
- **Zero Division**: Handled gracefully (0% margin when no sales)

#### Audit Trail
- **Calculation Timestamp**: When analysis was performed
- **Calculated By**: User who triggered the calculation
- **Calculation Method**: Automatic vs manual
- **Source Data**: Links to original invoices and expenses

## Usage Examples

### Daily Profit Calculation
```bash
curl -X POST /api/profit/daily \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-01-03"}'
```

### Monthly Profit Report
```bash
curl -X POST /api/profit/monthly \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"month": 1, "year": 2026}'
```

### Product Performance Analysis
```bash
curl -X POST /api/profit/product-wise \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  }'
```

### Dashboard Overview
```bash
curl -X GET "/api/profit/dashboard?period=current-month" \
  -H "Authorization: Bearer <token>"
```

### Profit Trends
```bash
curl -X GET "/api/profit/trends?startDate=2026-01-01&endDate=2026-01-31&groupBy=daily" \
  -H "Authorization: Bearer <token>"
```

## Seed Data

### Create Sample Profit Analyses
```bash
npm run seed:profit
```
Generates:
- Daily profit analyses for the last 7 days
- Monthly profit analyses for the last 3 months
- Product-wise profit analysis for current month
- Summary statistics and top product analysis

### Test Profit System
```bash
npm run test:profit
```
Comprehensive testing including:
- Data availability validation
- Calculation accuracy verification
- Formula validation
- Performance analysis
- Database integrity checks

**Note**: Requires existing invoices, expenses, and user data. Run other seed scripts first if needed.
## Dashboard APIs

### Get Dashboard Overview
- **GET** `/api/dashboard/overview`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Complete dashboard summary with all key metrics

### Get Today's Sales
- **GET** `/api/dashboard/todays-sales`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Today's sales performance with trends and breakdowns

### Get Monthly Profit
- **GET** `/api/dashboard/monthly-profit`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `month`: Target month (1-12, default: current month)
  - `year`: Target year (default: current year)
- **Description**: Monthly profit analysis with comparisons and trends

### Get Total Investments
- **GET** `/api/dashboard/total-investments`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Complete investment portfolio overview with ROI analysis

### Get Inventory Alerts
- **GET** `/api/dashboard/inventory-alerts`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `threshold`: Stock alert threshold (default: 10)
- **Description**: Inventory status with low stock and out-of-stock alerts

### Get Due Invoices
- **GET** `/api/dashboard/due-invoices`
- **Access**: Private (All authenticated users)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `daysOverdue`: Overdue threshold in days (default: 30)
- **Description**: Outstanding invoices with aging analysis

### Get Salary Summary
- **GET** `/api/dashboard/salary-summary`
- **Access**: Private (Manager and above)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `month`: Target month (1-12, default: current month)
  - `year`: Target year (default: current year)
- **Description**: Salary payments overview with department breakdown

## Dashboard Response Examples

### Dashboard Overview Response
```json
{
  "success": true,
  "data": {
    "lastUpdated": "2026-01-02T20:02:18.533Z",
    "todaysSales": {
      "totalSales": 5450,
      "totalPaid": 3450,
      "invoiceCount": 3,
      "collectionRate": 63.30
    },
    "monthlyProfit": {
      "netProfit": -110900,
      "totalSales": 3450,
      "profitMargin": -3214.49,
      "status": "loss"
    },
    "investments": {
      "totalAmount": 895000,
      "totalROI": 355000,
      "pendingCount": 1,
      "roiPercentage": -60.34
    },
    "inventory": {
      "lowStockAlerts": 5,
      "outOfStockAlerts": 0,
      "totalValue": 28850,
      "totalAlerts": 5
    },
    "dueInvoices": {
      "totalDue": 2000,
      "invoiceCount": 2,
      "avgDueAmount": 1000
    },
    "salaries": {
      "totalAmount": 51000,
      "paidCount": 1,
      "dueCount": 0,
      "paymentRate": 100
    }
  }
}
```

### Today's Sales Response
```json
{
  "success": true,
  "data": {
    "date": "Sat Jan 03 2026",
    "summary": {
      "totalInvoices": 3,
      "totalSales": 5450,
      "totalPaid": 3450,
      "totalDue": 2000,
      "avgOrderValue": 1816.67,
      "paidInvoices": 1,
      "partialInvoices": 2,
      "dueInvoices": 0,
      "collectionRate": 63.30
    },
    "trends": {
      "hourlySales": [
        {"_id": 19, "sales": 5450, "count": 3}
      ],
      "topProducts": [
        {
          "_id": "product_id",
          "productName": "Thai Granite - Black",
          "category": "Thai",
          "quantitySold": 30,
          "revenue": 4800
        }
      ],
      "paymentMethods": [
        {"_id": "bank_transfer", "count": 1, "amount": 2000},
        {"_id": "card", "count": 1, "amount": 950},
        {"_id": "cash", "count": 1, "amount": 500}
      ]
    }
  }
}
```

### Monthly Profit Response
```json
{
  "success": true,
  "data": {
    "period": {
      "month": 1,
      "year": 2026,
      "monthName": "January"
    },
    "currentMonth": {
      "totalSales": 3450,
      "totalCosts": 114350,
      "netProfit": -110900,
      "profitMargin": -3214.49,
      "profitStatus": "loss",
      "invoiceCount": 3,
      "avgOrderValue": 1150
    },
    "comparison": {
      "profitChange": -824.17,
      "salesChange": 0,
      "marginChange": -3214.49,
      "previousMonth": {
        "netProfit": -12000,
        "totalSales": 0,
        "profitMargin": 0
      }
    },
    "trends": [
      {
        "month": 12,
        "year": 2025,
        "totalSales": 3450,
        "totalCosts": 114350,
        "netProfit": -110900,
        "profitMargin": -3214.49
      }
    ],
    "costBreakdown": {
      "productCosts": 3.80,
      "salaryExpenses": 44.60,
      "otherExpenses": 51.60
    }
  }
}
```

### Total Investments Response
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalInvestments": 9,
      "totalAmount": 895000,
      "totalROI": 355000,
      "overallROIPercentage": -60.34,
      "avgInvestmentAmount": 99444.44,
      "pendingInvestments": 1,
      "approvedInvestments": 4,
      "completedInvestments": 4
    },
    "statusBreakdown": {
      "pending": {"count": 1, "amount": 35000},
      "approved": {"count": 4, "amount": 235000},
      "completed": {"count": 4, "amount": 625000}
    },
    "categoryBreakdown": [
      {
        "_id": "Capital Expenditure",
        "count": 4,
        "totalAmount": 625000,
        "avgAmount": 156250,
        "totalROI": 355000
      }
    ],
    "typeBreakdown": [
      {
        "_id": "Infrastructure",
        "count": 1,
        "totalAmount": 250000,
        "avgROI": 0
      }
    ],
    "recentInvestments": [
      {
        "investmentId": "INV-202601-0009",
        "title": "Stock Purchase - Premium Thai Marble",
        "amount": 15000,
        "investmentType": "Stock Purchase",
        "status": "approved"
      }
    ],
    "monthlyTrends": [
      {
        "_id": {"year": 2026, "month": 1},
        "count": 4,
        "totalAmount": 150000,
        "avgAmount": 37500
      }
    ],
    "topPerformers": [
      {
        "investmentId": "INV-202601-0001",
        "title": "New Cutting Machine Purchase",
        "amount": 150000,
        "actualROI": {
          "amount": 165000,
          "percentage": 10
        }
      }
    ]
  }
}
```

### Inventory Alerts Response
```json
{
  "success": true,
  "data": {
    "alertSummary": {
      "totalAlerts": 5,
      "criticalAlerts": 0,
      "warningAlerts": 5,
      "threshold": 50,
      "alertRate": 71.43
    },
    "inventoryMetrics": {
      "totalProducts": 7,
      "totalInventoryValue": 28850,
      "totalQuantity": 325,
      "avgStockLevel": 46.43,
      "lowStockProducts": 5,
      "outOfStockProducts": 0
    },
    "alerts": {
      "outOfStock": [],
      "lowStock": [
        {
          "name": "Premium Thai Marble - White",
          "category": "Thai",
          "stockQuantity": 45,
          "unit": "sqft",
          "sellingPrice": 200
        }
      ],
      "overstocked": []
    },
    "categoryBreakdown": [
      {
        "_id": "Thai",
        "totalProducts": 3,
        "totalQuantity": 150,
        "totalValue": 17550,
        "avgStockLevel": 50,
        "lowStockCount": 2,
        "outOfStockCount": 0
      }
    ],
    "recentMovements": [
      {
        "productName": "Thai Granite - Black",
        "category": "Thai",
        "currentStock": 45,
        "totalSold": 30,
        "totalRevenue": 4800
      }
    ]
  }
}
```

### Due Invoices Response
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalDueInvoices": 2,
      "totalDueAmount": 2000,
      "totalOverdueAmount": 0,
      "currentInvoices": 2,
      "recentInvoices": 0,
      "overdueInvoices": 0,
      "criticalInvoices": 0,
      "avgDueAmount": 1000,
      "overdueRate": 0
    },
    "categorizedInvoices": {
      "current": [
        {
          "invoiceNo": "INV-202601-0002",
          "customerName": "Partial Payment Customer",
          "customerPhone": "987-654-3210",
          "grandTotal": 1500,
          "paidAmount": 500,
          "dueAmount": 1000,
          "status": "partial",
          "daysOld": 0
        }
      ],
      "recent": [],
      "overdue": [],
      "critical": []
    },
    "topDebtors": [
      {
        "_id": "Partial Payment Customer",
        "customerPhone": "987-654-3210",
        "totalDue": 1000,
        "invoiceCount": 1,
        "oldestInvoice": "2026-01-02T19:16:38.342Z"
      }
    ],
    "agingAnalysis": [
      {
        "_id": 0,
        "count": 2,
        "totalAmount": 2000,
        "avgAmount": 1000
      }
    ],
    "collectionTrends": [
      {
        "_id": {"year": 2026, "month": 1},
        "totalInvoices": 3,
        "totalAmount": 5450,
        "totalCollected": 3450,
        "totalDue": 2000,
        "collectionRate": 63.30
      }
    ]
  }
}
```

### Salary Summary Response
```json
{
  "success": true,
  "data": {
    "period": {
      "month": 1,
      "year": 2026,
      "monthName": "January"
    },
    "summary": {
      "totalEmployees": 1,
      "totalGrossSalary": 58500,
      "totalDeductions": 7500,
      "totalNetSalary": 51000,
      "paidSalaries": 1,
      "dueSalaries": 0,
      "totalPaidAmount": 51000,
      "totalDueAmount": 0,
      "avgGrossSalary": 58500,
      "avgNetSalary": 51000,
      "paymentRate": 100,
      "deductionRate": 12.82,
      "pendingEmployees": 4
    },
    "departmentBreakdown": [
      {
        "_id": "Sales",
        "employeeCount": 1,
        "totalGrossSalary": 58500,
        "totalNetSalary": 51000,
        "avgSalary": 51000,
        "paidCount": 1,
        "dueCount": 0
      }
    ],
    "statusBreakdown": [
      {
        "_id": "paid",
        "count": 1,
        "totalAmount": 51000,
        "employees": [
          {
            "employeeId": "EMP-0001",
            "name": "John Smith",
            "department": "Sales",
            "netSalary": 51000,
            "paymentDate": "2026-01-02T19:30:02.296Z"
          }
        ]
      }
    ],
    "monthlyTrends": [
      {
        "_id": {"year": 2026, "month": 1},
        "employeeCount": 1,
        "totalGrossSalary": 58500,
        "totalNetSalary": 51000,
        "totalDeductions": 7500,
        "paidCount": 1
      }
    ],
    "upcomingSalaries": [
      {
        "employeeId": "EMP-0004",
        "name": "Lisa Wilson",
        "department": "Finance",
        "monthlySalary": 35000
      }
    ]
  }
}
```

## Dashboard Features

### Performance Optimization
- **Parallel Queries**: Multiple dashboard components loaded simultaneously
- **Aggregation Pipelines**: Optimized MongoDB queries for fast response
- **Caching Ready**: Structured for Redis caching implementation
- **Minimal Data Transfer**: Only essential data in responses

### Real-time Metrics
- **Today's Performance**: Live sales and collection tracking
- **Current Month**: Up-to-date profit and expense analysis
- **Inventory Status**: Real-time stock level monitoring
- **Payment Tracking**: Outstanding invoice management

### Business Intelligence
- **Trend Analysis**: Historical data comparison and patterns
- **Performance Indicators**: KPIs for business health monitoring
- **Alert System**: Proactive notifications for critical issues
- **Comparative Analysis**: Month-over-month and period comparisons

### Access Control
- **Role-based Access**: Different access levels for different user roles
- **Sensitive Data Protection**: Financial data restricted to managers and above
- **Audit Trail**: All dashboard access logged for security

### Data Accuracy
- **Real-time Calculations**: Always current data from live database
- **Consistent Formulas**: Same calculation logic across all endpoints
- **Data Validation**: Input validation and error handling
- **Transaction Safety**: Atomic operations for data consistency

## Usage Examples

### Get Complete Dashboard
```bash
curl -X GET "http://localhost:3001/api/dashboard/overview" \
  -H "Authorization: Bearer <token>"
```

### Check Today's Sales Performance
```bash
curl -X GET "http://localhost:3001/api/dashboard/todays-sales" \
  -H "Authorization: Bearer <token>"
```

### Monitor Inventory Alerts
```bash
curl -X GET "http://localhost:3001/api/dashboard/inventory-alerts?threshold=20" \
  -H "Authorization: Bearer <token>"
```

### Review Monthly Profit
```bash
curl -X GET "http://localhost:3001/api/dashboard/monthly-profit?month=1&year=2026" \
  -H "Authorization: Bearer <token>"
```

### Track Investment Portfolio
```bash
curl -X GET "http://localhost:3001/api/dashboard/total-investments" \
  -H "Authorization: Bearer <token>"
```

### Manage Outstanding Payments
```bash
curl -X GET "http://localhost:3001/api/dashboard/due-invoices" \
  -H "Authorization: Bearer <token>"
```

### Review Salary Status
```bash
curl -X GET "http://localhost:3001/api/dashboard/salary-summary?month=1&year=2026" \
  -H "Authorization: Bearer <token>"
```

## Testing

### Test Dashboard System
```bash
npm run test:dashboard
```

Comprehensive testing including:
- Data availability validation
- Performance metrics measurement
- Response time analysis
- Data consistency checks
- Error handling verification

**Note**: All dashboard endpoints are optimized for performance and provide comprehensive business intelligence for effective management decision-making.