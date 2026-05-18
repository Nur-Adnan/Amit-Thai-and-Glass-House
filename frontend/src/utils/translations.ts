// Translation dictionary for Bengali/English toggle system

export interface Translations {
  // Common
  loading: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  search: string;
  filter: string;
  export: string;
  print: string;
  total: string;
  subtotal: string;
  discount: string;
  grandTotal: string;
  paid: string;
  due: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  address: string;
  email: string;
  status: string;
  actions: string;
  confirm: string;
  yes: string;
  no: string;

  // Navigation
  dashboard: string;
  inventory: string;
  calculator: string;
  invoice: string;
  payroll: string;
  reports: string;
  deletedItems: string;
  permissions: string;
  shopConfig: string;
  signOut: string;
  createInvoice: string;
  invoices: string;
  customers: string;
  expenses: string;
  settings: string;

  // Dashboard
  dailySummary: string;
  todaysSales: string;
  totalInvoices: string;
  totalCustomers: string;
  pendingPayments: string;
  recentInvoices: string;
  topProducts: string;
  salesTrend: string;

  // Calculator
  priceCalculator: string;
  calculatePricing: string;
  materialType: string;
  inputType: string;
  decimal: string;
  feetInches: string;
  dimensions: string;
  length: string;
  width: string;
  feet: string;
  inches: string;
  customPrice: string;
  useCustomPrice: string;
  currentPrice: string;
  perSqFt: string;
  calculatePrice: string;
  calculating: string;
  calculationResult: string;
  totalPrice: string;
  material: string;
  area: string;
  pricePerSqFt: string;
  calculationBreakdown: string;
  enterDimensions: string;

  // Invoice
  invoiceList: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  itemTotal: string;
  addItem: string;
  removeItem: string;
  discountType: string;
  percentage: string;
  amount: string;
  paymentMethod: string;
  cash: string;
  card: string;
  bankTransfer: string;
  cheque: string;
  notes: string;
  createInvoiceBtn: string;
  printInvoice: string;

  // Invoice Status
  invoicePaid: string;
  partial: string;
  unpaid: string;

  // Reports
  salesReport: string;
  profitReport: string;
  customerReport: string;
  productReport: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  generateReport: string;

  // Service Charges
  serviceCharges: string;
  deliveryCharge: string;
  installationCharge: string;
  installerName: string;
  installerPhone: string;
  serviceNotes: string;

  // Validation Messages
  required: string;
  invalidEmail: string;
  invalidPhone: string;
  invalidAmount: string;
  minimumAmount: string;
  maximumAmount: string;

  // Success Messages
  saveSuccess: string;
  deleteSuccess: string;
  updateSuccess: string;

  // Error Messages
  saveError: string;
  deleteError: string;
  updateError: string;
  networkError: string;

  // Units
  sqft: string;
  piece: string;
  kg: string;
  meter: string;

  // Materials
  thai: string;
  glass: string;

  // Time periods
  today: string;
  yesterday: string;
  thisWeek: string;
  thisMonth: string;
  thisYear: string;

  // Language toggle
  language: string;
  english: string;
  bangla: string;

  // Trust Information
  trustInfo: string;
  tradeLicenseNo: string;
  shopAddress: string;
  contactNumber: string;
  displayOnInvoice: string;
  displayOnPrint: string;
  businessCredibility: string;
  customerTrust: string;

  // Financial Warnings
  financialWarnings: string;
  cashSales: string;
  dueSales: string;
  totalDue: string;
  warningSignals: string;
  criticalAlerts: string;
  recommendations: string;
  overallRiskLevel: string;
  highRisk: string;
  mediumRisk: string;
  lowRisk: string;
  cashFlowRatio: string;
  collectionRecommendations: string;

  // Accessibility
  a11ySkipToContent: string;
}

export const translations: Record<'en' | 'bn', Translations> = {
  en: {
    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    print: 'Print',
    total: 'Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    grandTotal: 'Grand Total',
    paid: 'Paid',
    due: 'Due',
    date: 'Date',
    time: 'Time',
    name: 'Name',
    phone: 'Phone',
    address: 'Address',
    email: 'Email',
    status: 'Status',
    actions: 'Actions',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',

    // Navigation
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    calculator: 'Calculator',
    invoice: 'Invoice',
    payroll: 'Payroll',
    reports: 'Reports',
    deletedItems: 'Deleted Items',
    permissions: 'Permissions',
    shopConfig: 'Shop Config',
    signOut: 'Sign out',
    createInvoice: 'Create Invoice',
    invoices: 'Invoices',
    customers: 'Customers',
    expenses: 'Expenses',
    settings: 'Settings',

    // Dashboard
    dailySummary: 'Daily Summary',
    todaysSales: "Today's Sales",
    totalInvoices: 'Total Invoices',
    totalCustomers: 'Total Customers',
    pendingPayments: 'Pending Payments',
    recentInvoices: 'Recent Invoices',
    topProducts: 'Top Products',
    salesTrend: 'Sales Trend',

    // Calculator
    priceCalculator: 'Price Calculator',
    calculatePricing: 'Calculate pricing for Thai and Glass materials',
    materialType: 'Material Type',
    inputType: 'Input Type',
    decimal: 'Decimal',
    feetInches: 'Feet & Inches',
    dimensions: 'Dimensions',
    length: 'Length',
    width: 'Width',
    feet: 'Feet',
    inches: 'Inches',
    customPrice: 'Custom Price',
    useCustomPrice: 'Use custom price per sq ft',
    currentPrice: 'Current Price',
    perSqFt: 'per sq ft',
    calculatePrice: 'Calculate Price',
    calculating: 'Calculating...',
    calculationResult: 'Calculation Result',
    totalPrice: 'Total Price',
    material: 'Material',
    area: 'Area',
    pricePerSqFt: 'Price per sq ft',
    calculationBreakdown: 'Calculation Breakdown',
    enterDimensions: 'Enter dimensions and click calculate to see the price',

    // Invoice
    invoiceList: 'Invoice List',
    invoiceNumber: 'Invoice Number',
    customerName: 'Customer Name',
    customerPhone: 'Customer Phone',
    customerAddress: 'Customer Address',
    items: 'Items',
    quantity: 'Quantity',
    unit: 'Unit',
    unitPrice: 'Unit Price',
    itemTotal: 'Item Total',
    addItem: 'Add Item',
    removeItem: 'Remove Item',
    discountType: 'Discount Type',
    percentage: 'Percentage',
    amount: 'Amount',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    card: 'Card',
    bankTransfer: 'Bank Transfer',
    cheque: 'Cheque',
    notes: 'Notes',
    createInvoiceBtn: 'Create Invoice',
    printInvoice: 'Print Invoice',

    // Invoice Status
    invoicePaid: 'Paid',
    partial: 'Partial',
    unpaid: 'Unpaid',

    // Reports
    salesReport: 'Sales Report',
    profitReport: 'Profit Report',
    customerReport: 'Customer Report',
    productReport: 'Product Report',
    dateRange: 'Date Range',
    startDate: 'Start Date',
    endDate: 'End Date',
    generateReport: 'Generate Report',

    // Service Charges
    serviceCharges: 'Service Charges',
    deliveryCharge: 'Delivery Charge',
    installationCharge: 'Installation Charge',
    installerName: 'Installer Name',
    installerPhone: 'Installer Phone',
    serviceNotes: 'Service Notes',

    // Validation Messages
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    invalidAmount: 'Please enter a valid amount',
    minimumAmount: 'Amount must be greater than 0',
    maximumAmount: 'Amount exceeds maximum limit',

    // Success Messages
    saveSuccess: 'Saved successfully',
    deleteSuccess: 'Deleted successfully',
    updateSuccess: 'Updated successfully',

    // Error Messages
    saveError: 'Failed to save',
    deleteError: 'Failed to delete',
    updateError: 'Failed to update',
    networkError: 'Network error occurred',

    // Units
    sqft: 'sq ft',
    piece: 'piece',
    kg: 'kg',
    meter: 'meter',

    // Materials
    thai: 'Thai',
    glass: 'Glass',

    // Time periods
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',

    // Language toggle
    language: 'Language',
    english: 'English',
    bangla: 'বাংলা',

    // Trust Information
    trustInfo: 'Trust Information',
    tradeLicenseNo: 'Trade License No',
    shopAddress: 'Shop Address',
    contactNumber: 'Contact Number',
    displayOnInvoice: 'Display on Invoice',
    displayOnPrint: 'Display on Print',
    businessCredibility: 'Business Credibility',
    customerTrust: 'Customer Trust',

    // Financial Warnings
    financialWarnings: 'Financial Warnings',
    cashSales: 'Cash Sales',
    dueSales: 'Due Sales',
    totalDue: 'Total Due',
    warningSignals: 'Warning Signals',
    criticalAlerts: 'Critical Alerts',
    recommendations: 'Recommendations',
    overallRiskLevel: 'Overall Risk Level',
    highRisk: 'High Risk',
    mediumRisk: 'Medium Risk',
    lowRisk: 'Low Risk',
    cashFlowRatio: 'Cash Flow Ratio',
    collectionRecommendations: 'Collection Recommendations',

    // Accessibility
    a11ySkipToContent: 'Skip to content',
  },

  bn: {
    // Common
    loading: 'লোড হচ্ছে...',
    save: 'সংরক্ষণ',
    cancel: 'বাতিল',
    delete: 'মুছুন',
    edit: 'সম্পাদনা',
    add: 'যোগ করুন',
    search: 'অনুসন্ধান',
    filter: 'ফিল্টার',
    export: 'রপ্তানি',
    print: 'প্রিন্ট',
    total: 'মোট',
    subtotal: 'উপমোট',
    discount: 'ছাড়',
    grandTotal: 'সর্বমোট',
    paid: 'পরিশোধিত',
    due: 'বকেয়া',
    date: 'তারিখ',
    time: 'সময়',
    name: 'নাম',
    phone: 'ফোন',
    address: 'ঠিকানা',
    email: 'ইমেইল',
    status: 'অবস্থা',
    actions: 'কার্যক্রম',
    confirm: 'নিশ্চিত করুন',
    yes: 'হ্যাঁ',
    no: 'না',

    // Navigation
    dashboard: 'ড্যাশবোর্ড',
    inventory: 'ইনভেন্টরি',
    calculator: 'ক্যালকুলেটর',
    invoice: 'ইনভয়েস',
    payroll: 'বেতন',
    reports: 'রিপোর্ট',
    deletedItems: 'মুছে ফেলা আইটেম',
    permissions: 'অনুমতি',
    shopConfig: 'দোকান কনফিগ',
    signOut: 'সাইন আউট',
    createInvoice: 'ইনভয়েস তৈরি করুন',
    invoices: 'ইনভয়েস সমূহ',
    customers: 'গ্রাহকগণ',
    expenses: 'খরচ',
    settings: 'সেটিংস',

    // Dashboard
    dailySummary: 'দৈনিক সারসংক্ষেপ',
    todaysSales: 'আজকের বিক্রয়',
    totalInvoices: 'মোট ইনভয়েস',
    totalCustomers: 'মোট গ্রাহক',
    pendingPayments: 'অমীমাংসিত পেমেন্ট',
    recentInvoices: 'সাম্প্রতিক ইনভয়েস',
    topProducts: 'শীর্ষ পণ্য',
    salesTrend: 'বিক্রয় প্রবণতা',

    // Calculator
    priceCalculator: 'মূল্য ক্যালকুলেটর',
    calculatePricing: 'থাই এবং গ্লাস উপকরণের মূল্য গণনা করুন',
    materialType: 'উপাদানের ধরন',
    inputType: 'ইনপুট ধরন',
    decimal: 'দশমিক',
    feetInches: 'ফুট ও ইঞ্চি',
    dimensions: 'মাত্রা',
    length: 'দৈর্ঘ্য',
    width: 'প্রস্থ',
    feet: 'ফুট',
    inches: 'ইঞ্চি',
    customPrice: 'কাস্টম মূল্য',
    useCustomPrice: 'প্রতি বর্গফুট কাস্টম মূল্য ব্যবহার করুন',
    currentPrice: 'বর্তমান মূল্য',
    perSqFt: 'প্রতি বর্গফুট',
    calculatePrice: 'মূল্য গণনা করুন',
    calculating: 'গণনা করা হচ্ছে...',
    calculationResult: 'গণনার ফলাফল',
    totalPrice: 'মোট মূল্য',
    material: 'উপাদান',
    area: 'ক্ষেত্রফল',
    pricePerSqFt: 'প্রতি বর্গফুট মূল্য',
    calculationBreakdown: 'গণনার বিস্তারিত',
    enterDimensions: 'মাত্রা প্রবেশ করান এবং মূল্য দেখতে গণনা করুন ক্লিক করুন',

    // Invoice
    invoiceList: 'ইনভয়েস তালিকা',
    invoiceNumber: 'ইনভয়েস নম্বর',
    customerName: 'গ্রাহকের নাম',
    customerPhone: 'গ্রাহকের ফোন',
    customerAddress: 'গ্রাহকের ঠিকানা',
    items: 'আইটেম',
    quantity: 'পরিমাণ',
    unit: 'একক',
    unitPrice: 'একক মূল্য',
    itemTotal: 'আইটেম মোট',
    addItem: 'আইটেম যোগ করুন',
    removeItem: 'আইটেম সরান',
    discountType: 'ছাড়ের ধরন',
    percentage: 'শতাংশ',
    amount: 'পরিমাণ',
    paymentMethod: 'পেমেন্ট পদ্ধতি',
    cash: 'নগদ',
    card: 'কার্ড',
    bankTransfer: 'ব্যাংক ট্রান্সফার',
    cheque: 'চেক',
    notes: 'নোট',
    createInvoiceBtn: 'ইনভয়েস তৈরি করুন',
    printInvoice: 'ইনভয়েস প্রিন্ট করুন',

    // Invoice Status
    invoicePaid: 'পরিশোধিত',
    partial: 'আংশিক',
    unpaid: 'অপরিশোধিত',

    // Reports
    salesReport: 'বিক্রয় রিপোর্ট',
    profitReport: 'লাভ রিপোর্ট',
    customerReport: 'গ্রাহক রিপোর্ট',
    productReport: 'পণ্য রিপোর্ট',
    dateRange: 'তারিখের পরিসর',
    startDate: 'শুরুর তারিখ',
    endDate: 'শেষ তারিখ',
    generateReport: 'রিপোর্ট তৈরি করুন',

    // Service Charges
    serviceCharges: 'সেবা চার্জ',
    deliveryCharge: 'ডেলিভারি চার্জ',
    installationCharge: 'ইনস্টলেশন চার্জ',
    installerName: 'ইনস্টলারের নাম',
    installerPhone: 'ইনস্টলারের ফোন',
    serviceNotes: 'সেবা নোট',

    // Validation Messages
    required: 'এই ক্ষেত্রটি প্রয়োজনীয়',
    invalidEmail: 'অনুগ্রহ করে একটি বৈধ ইমেইল ঠিকানা প্রবেশ করান',
    invalidPhone: 'অনুগ্রহ করে একটি বৈধ ফোন নম্বর প্রবেশ করান',
    invalidAmount: 'অনুগ্রহ করে একটি বৈধ পরিমাণ প্রবেশ করান',
    minimumAmount: 'পরিমাণ ০ এর চেয়ে বেশি হতে হবে',
    maximumAmount: 'পরিমাণ সর্বোচ্চ সীমা অতিক্রম করেছে',

    // Success Messages
    saveSuccess: 'সফলভাবে সংরক্ষিত হয়েছে',
    deleteSuccess: 'সফলভাবে মুছে ফেলা হয়েছে',
    updateSuccess: 'সফলভাবে আপডেট হয়েছে',

    // Error Messages
    saveError: 'সংরক্ষণ করতে ব্যর্থ',
    deleteError: 'মুছে ফেলতে ব্যর্থ',
    updateError: 'আপডেট করতে ব্যর্থ',
    networkError: 'নেটওয়ার্ক ত্রুটি ঘটেছে',

    // Units
    sqft: 'বর্গফুট',
    piece: 'পিস',
    kg: 'কেজি',
    meter: 'মিটার',

    // Materials
    thai: 'থাই',
    glass: 'গ্লাস',

    // Time periods
    today: 'আজ',
    yesterday: 'গতকাল',
    thisWeek: 'এই সপ্তাহ',
    thisMonth: 'এই মাস',
    thisYear: 'এই বছর',

    // Language toggle
    language: 'ভাষা',
    english: 'English',
    bangla: 'বাংলা',

    // Trust Information
    trustInfo: 'বিশ্বস্ততার তথ্য',
    tradeLicenseNo: 'ট্রেড লাইসেন্স নং',
    shopAddress: 'দোকানের ঠিকানা',
    contactNumber: 'যোগাযোগ নম্বর',
    displayOnInvoice: 'ইনভয়েসে দেখান',
    displayOnPrint: 'প্রিন্টে দেখান',
    businessCredibility: 'ব্যবসায়িক বিশ্বাসযোগ্যতা',
    customerTrust: 'গ্রাহক আস্থা',

    // Financial Warnings
    financialWarnings: 'আর্থিক সতর্কতা',
    cashSales: 'নগদ বিক্রয়',
    dueSales: 'বাকি বিক্রয়',
    totalDue: 'মোট বকেয়া',
    warningSignals: 'সতর্কতা সংকেত',
    criticalAlerts: 'জরুরি সতর্কতা',
    recommendations: 'সুপারিশ',
    overallRiskLevel: 'সামগ্রিক ঝুঁকির মাত্রা',
    highRisk: 'উচ্চ ঝুঁকি',
    mediumRisk: 'মধ্যম ঝুঁকি',
    lowRisk: 'নিম্ন ঝুঁকি',
    cashFlowRatio: 'নগদ প্রবাহ অনুপাত',
    collectionRecommendations: 'আদায়ের সুপারিশ',

    // Accessibility
    a11ySkipToContent: 'মূল বিষয়বস্তুতে যান',
  }
};

export const getTranslation = (language: 'en' | 'bn', key: keyof Translations): string => {
  return translations[language][key] || key;
};