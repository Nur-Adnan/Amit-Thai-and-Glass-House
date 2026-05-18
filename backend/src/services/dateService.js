/**
 * Date Service
 * Standardized date formatting and validation for the application
 */

class DateService {
  static DEFAULT_TIMEZONE = 'Asia/Dhaka';
  static DEFAULT_LOCALE = 'en-US';
  static BENGALI_LOCALE = 'bn-BD';

  /**
   * Format date for different contexts
   * @param {Date|string} date - Date to format
   * @param {string} format - Format type
   * @param {object} options - Formatting options
   * @returns {string} Formatted date string
   */
  static format(date, format = 'default', options = {}) {
    const {
      locale = this.DEFAULT_LOCALE,
      timeZone = this.DEFAULT_TIMEZONE,
      includeTime = false
    } = options;

    if (!date) return '';

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    try {
      switch (format) {
        case 'short':
          // 1/3/26
          return dateObj.toLocaleDateString(locale, { 
            timeZone,
            month: 'numeric',
            day: 'numeric',
            year: '2-digit'
          });

        case 'medium':
          // Jan 3, 2026
          return dateObj.toLocaleDateString(locale, { 
            timeZone,
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

        case 'long':
          // January 3, 2026
          return dateObj.toLocaleDateString(locale, {
            timeZone,
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

        case 'full':
          // Saturday, January 3, 2026
          return dateObj.toLocaleDateString(locale, {
            timeZone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

        case 'business':
          // 03/01/2026 (DD/MM/YYYY)
          return dateObj.toLocaleDateString('en-GB', { timeZone });

        case 'iso':
          // 2026-01-03T10:30:00.000Z
          return dateObj.toISOString();

        case 'timestamp':
          // 2026-01-03 10:30:00
          return dateObj.toLocaleString('sv-SE', { timeZone });

        case 'time':
          // 10:30 AM
          return dateObj.toLocaleTimeString(locale, {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: locale === 'en-US'
          });

        case 'datetime':
          // Jan 3, 2026 10:30 AM
          return dateObj.toLocaleString(locale, {
            timeZone,
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: locale === 'en-US'
          });

        case 'invoice':
          // January 3, 2026
          return dateObj.toLocaleDateString(locale, {
            timeZone,
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

        case 'report':
          // 2026-01-03
          return dateObj.toLocaleDateString('sv-SE', { timeZone });

        case 'audit':
          // 2026-01-03 10:30:00 +06:00
          return dateObj.toLocaleString('sv-SE', { 
            timeZone,
            timeZoneName: 'short'
          });

        case 'bengali':
          // Bengali date format
          return this.formatBengali(dateObj, options);

        case 'relative':
          // 2 hours ago, 3 days ago, etc.
          return this.getRelativeTime(dateObj, options);

        default:
          // Default: Jan 3, 2026 (with time if includeTime is true)
          const baseFormat = {
            timeZone,
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          };

          if (includeTime) {
            return dateObj.toLocaleString(locale, {
              ...baseFormat,
              hour: '2-digit',
              minute: '2-digit',
              hour12: locale === 'en-US'
            });
          }

          return dateObj.toLocaleDateString(locale, baseFormat);
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateObj.toString();
    }
  }

  /**
   * Format date in Bengali
   * @param {Date} date - Date to format
   * @param {object} options - Formatting options
   * @returns {string} Bengali formatted date
   */
  static formatBengali(date, options = {}) {
    const { includeTime = false } = options;

    try {
      const bengaliMonths = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];

      const bengaliDays = [
        'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
      ];

      const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

      const convertToBengaliNumerals = (num) => {
        return num.toString().split('').map(digit => bengaliNumerals[parseInt(digit)]).join('');
      };

      const day = convertToBengaliNumerals(date.getDate());
      const month = bengaliMonths[date.getMonth()];
      const year = convertToBengaliNumerals(date.getFullYear());
      const weekday = bengaliDays[date.getDay()];

      let result = `${day} ${month}, ${year}`;

      if (includeTime) {
        const hours = convertToBengaliNumerals(date.getHours().toString().padStart(2, '0'));
        const minutes = convertToBengaliNumerals(date.getMinutes().toString().padStart(2, '0'));
        result += ` ${hours}:${minutes}`;
      }

      return result;
    } catch (error) {
      console.error('Bengali date formatting error:', error);
      return this.format(date, 'long');
    }
  }

  /**
   * Get relative time (e.g., "2 hours ago")
   * @param {Date} date - Date to compare
   * @param {object} options - Options
   * @returns {string} Relative time string
   */
  static getRelativeTime(date, options = {}) {
    const { locale = this.DEFAULT_LOCALE, now = new Date() } = options;

    try {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

      const intervals = [
        { unit: 'year', seconds: 31536000 },
        { unit: 'month', seconds: 2592000 },
        { unit: 'week', seconds: 604800 },
        { unit: 'day', seconds: 86400 },
        { unit: 'hour', seconds: 3600 },
        { unit: 'minute', seconds: 60 },
        { unit: 'second', seconds: 1 }
      ];

      for (const interval of intervals) {
        const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
        if (count >= 1) {
          return rtf.format(diffInSeconds < 0 ? -count : count, interval.unit);
        }
      }

      return rtf.format(0, 'second');
    } catch (error) {
      console.error('Relative time formatting error:', error);
      return this.format(date, 'datetime');
    }
  }

  /**
   * Validate date
   * @param {any} date - Date to validate
   * @param {object} options - Validation options
   * @returns {object} Validation result
   */
  static validate(date, options = {}) {
    const {
      required = true,
      allowFuture = true,
      allowPast = true,
      minDate = null,
      maxDate = null,
      fieldName = 'Date'
    } = options;

    const errors = [];

    // Check if date is provided
    if (!date) {
      if (required) {
        errors.push(`${fieldName} is required`);
      }
      return {
        isValid: !required,
        errors,
        sanitizedDate: null
      };
    }

    // Convert to Date object
    let dateObj;
    try {
      dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [`${fieldName} must be a valid date`],
        sanitizedDate: null
      };
    }

    const now = new Date();

    // Check future dates
    if (!allowFuture && dateObj > now) {
      errors.push(`${fieldName} cannot be in the future`);
    }

    // Check past dates
    if (!allowPast && dateObj < now) {
      errors.push(`${fieldName} cannot be in the past`);
    }

    // Check minimum date
    if (minDate && dateObj < new Date(minDate)) {
      errors.push(`${fieldName} cannot be before ${this.format(minDate, 'medium')}`);
    }

    // Check maximum date
    if (maxDate && dateObj > new Date(maxDate)) {
      errors.push(`${fieldName} cannot be after ${this.format(maxDate, 'medium')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedDate: dateObj,
      formattedDate: this.format(dateObj, 'medium')
    };
  }

  /**
   * Validate date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {object} options - Validation options
   * @returns {object} Validation result
   */
  static validateRange(startDate, endDate, options = {}) {
    const { maxRangeDays = null } = options;
    const errors = [];

    const startValidation = this.validate(startDate, { ...options, fieldName: 'Start date' });
    const endValidation = this.validate(endDate, { ...options, fieldName: 'End date' });

    if (!startValidation.isValid) {
      errors.push(...startValidation.errors);
    }

    if (!endValidation.isValid) {
      errors.push(...endValidation.errors);
    }

    if (startValidation.isValid && endValidation.isValid) {
      if (startValidation.sanitizedDate > endValidation.sanitizedDate) {
        errors.push('Start date cannot be after end date');
      }

      // Check maximum range
      if (maxRangeDays) {
        const diffInDays = Math.ceil(
          (endValidation.sanitizedDate - startValidation.sanitizedDate) / (1000 * 60 * 60 * 24)
        );
        if (diffInDays > maxRangeDays) {
          errors.push(`Date range cannot exceed ${maxRangeDays} days`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      startDate: startValidation.sanitizedDate,
      endDate: endValidation.sanitizedDate,
      formattedRange: startValidation.sanitizedDate && endValidation.sanitizedDate
        ? `${this.format(startValidation.sanitizedDate, 'medium')} - ${this.format(endValidation.sanitizedDate, 'medium')}`
        : null
    };
  }

  /**
   * Get business date utilities
   * @returns {object} Business date utilities
   */
  static getBusinessDates() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return {
      today,
      yesterday: new Date(today.getTime() - 24 * 60 * 60 * 1000),
      tomorrow: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      startOfWeek: this.getStartOfWeek(today),
      endOfWeek: this.getEndOfWeek(today),
      startOfMonth: new Date(today.getFullYear(), today.getMonth(), 1),
      endOfMonth: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      startOfYear: new Date(today.getFullYear(), 0, 1),
      endOfYear: new Date(today.getFullYear(), 11, 31),
      formatted: {
        today: this.format(today, 'business'),
        yesterday: this.format(new Date(today.getTime() - 24 * 60 * 60 * 1000), 'business'),
        startOfMonth: this.format(new Date(today.getFullYear(), today.getMonth(), 1), 'business'),
        endOfMonth: this.format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'business')
      }
    };
  }

  /**
   * Get start of week (Sunday)
   * @param {Date} date - Reference date
   * @returns {Date} Start of week
   */
  static getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  /**
   * Get end of week (Saturday)
   * @param {Date} date - Reference date
   * @returns {Date} End of week
   */
  static getEndOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + 6;
    return new Date(d.setDate(diff));
  }

  /**
   * Parse various date formats
   * @param {string} dateString - Date string to parse
   * @returns {Date|null} Parsed date or null
   */
  static parse(dateString) {
    if (!dateString) return null;

    // Try different date formats
    const formats = [
      // ISO formats
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // 2026-01-03T10:30:00
      /^\d{4}-\d{2}-\d{2}/, // 2026-01-03
      
      // DD/MM/YYYY formats
      /^\d{1,2}\/\d{1,2}\/\d{4}/, // 3/1/2026 or 03/01/2026
      
      // MM/DD/YYYY formats
      /^\d{1,2}-\d{1,2}-\d{4}/, // 1-3-2026 or 01-03-2026
      
      // Natural language
      /^(today|yesterday|tomorrow)$/i
    ];

    try {
      // Handle natural language
      if (/^today$/i.test(dateString)) {
        return new Date();
      }
      if (/^yesterday$/i.test(dateString)) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
      }
      if (/^tomorrow$/i.test(dateString)) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      }

      // Try parsing as-is first
      const parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }

      return null;
    } catch (error) {
      console.error('Date parsing error:', error);
      return null;
    }
  }

  /**
   * Get date configuration for frontend
   * @returns {object} Date configuration
   */
  static getConfig() {
    return {
      timezone: this.DEFAULT_TIMEZONE,
      locale: this.DEFAULT_LOCALE,
      bengaliLocale: this.BENGALI_LOCALE,
      formats: {
        short: 'M/d/yy',
        medium: 'MMM d, yyyy',
        long: 'MMMM d, yyyy',
        full: 'EEEE, MMMM d, yyyy',
        business: 'dd/MM/yyyy',
        iso: 'yyyy-MM-dd',
        timestamp: 'yyyy-MM-dd HH:mm:ss'
      },
      businessDates: this.getBusinessDates().formatted
    };
  }
}

export default DateService;