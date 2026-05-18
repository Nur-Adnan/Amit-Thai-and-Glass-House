# Real-World Shop Usage Manual Testing Checklist

## Overview
This checklist ensures the invoice system works perfectly in real shop environments with proper print quality, device compatibility, and professional appearance.

## Test Environment Setup
- [ ] Physical printer available (preferably inkjet and laser)
- [ ] A4 paper loaded in printer
- [ ] Low-end device available for testing (Android 4.4+, 1GB RAM)
- [ ] Black & white printer or grayscale print setting
- [ ] Business logo and trade license information ready

---

## 1. A4 Print Alignment Testing

### 1.1 Page Layout Verification
- [ ] **Test:** Print a sample invoice on A4 paper
- [ ] **Check:** All content fits within A4 dimensions (210mm × 297mm)
- [ ] **Check:** No content is cut off at edges
- [ ] **Check:** Margins are consistent (minimum 12.7mm on all sides)
- [ ] **Expected:** Perfect fit with no clipping

### 1.2 Header Alignment
- [ ] **Test:** Verify header section layout
- [ ] **Check:** Logo positioned in top-left corner
- [ ] **Check:** Business information aligned to top-right
- [ ] **Check:** Invoice title centered below header
- [ ] **Check:** No overlap between header elements
- [ ] **Expected:** Professional header layout with clear separation

### 1.3 Table Alignment
- [ ] **Test:** Print invoice with 10+ items
- [ ] **Check:** Table headers properly aligned
- [ ] **Check:** All columns fit within page width
- [ ] **Check:** Text doesn't overflow column boundaries
- [ ] **Check:** Row heights are consistent
- [ ] **Expected:** Clean, readable table structure

### 1.4 Footer Alignment
- [ ] **Test:** Verify footer positioning
- [ ] **Check:** Totals section aligned to right
- [ ] **Check:** Signature area positioned bottom-left
- [ ] **Check:** Terms and conditions fit in designated area
- [ ] **Check:** Footer doesn't overlap with table content
- [ ] **Expected:** Professional footer with proper spacing

### 1.5 Multi-page Handling
- [ ] **Test:** Create invoice with 30+ items (forces multiple pages)
- [ ] **Check:** Page breaks occur at appropriate points
- [ ] **Check:** Headers repeat on subsequent pages
- [ ] **Check:** Totals appear only on final page
- [ ] **Check:** Page numbers displayed correctly
- [ ] **Expected:** Clean multi-page layout

---

## 2. No UI Elements in Print Testing

### 2.1 UI Element Removal
- [ ] **Test:** Print invoice from browser
- [ ] **Check:** No navigation menu visible in print
- [ ] **Check:** No sidebar elements in print
- [ ] **Check:** No buttons (Save, Edit, Delete) in print
- [ ] **Check:** No form controls in print
- [ ] **Expected:** Only invoice content visible

### 2.2 Interactive Element Removal
- [ ] **Test:** Inspect print preview
- [ ] **Check:** No clickable links in print version
- [ ] **Check:** No hover effects in print
- [ ] **Check:** No form inputs in print
- [ ] **Check:** No JavaScript interactions in print
- [ ] **Expected:** Static, print-optimized content

### 2.3 Print-Specific Styling
- [ ] **Test:** Compare screen vs print appearance
- [ ] **Check:** Print uses appropriate fonts (Arial, Times New Roman)
- [ ] **Check:** Print uses black text on white background
- [ ] **Check:** Print has proper line spacing
- [ ] **Check:** Print has clear borders and separators
- [ ] **Expected:** Professional print formatting

### 2.4 Content Completeness
- [ ] **Test:** Verify all essential information prints
- [ ] **Check:** Business name and logo print correctly
- [ ] **Check:** Customer information prints completely
- [ ] **Check:** All invoice items print with details
- [ ] **Check:** Totals and payment information print
- [ ] **Expected:** Complete invoice information

---

## 3. PDF Opens on Low-End Devices Testing

### 3.1 File Size Optimization
- [ ] **Test:** Generate PDF of typical invoice
- [ ] **Check:** PDF file size under 2MB
- [ ] **Check:** PDF loads within 10 seconds on 2G connection
- [ ] **Check:** PDF doesn't crash browser on 1GB RAM device
- [ ] **Expected:** Fast, reliable PDF loading

### 3.2 Device Compatibility
- [ ] **Test:** Open PDF on Android 4.4 device
- [ ] **Check:** PDF opens without errors
- [ ] **Check:** All text renders correctly
- [ ] **Check:** Images display properly
- [ ] **Check:** PDF is scrollable and zoomable
- [ ] **Expected:** Full compatibility with older devices

### 3.3 Performance Testing
- [ ] **Test:** Monitor PDF loading performance
- [ ] **Check:** First page appears within 5 seconds
- [ ] **Check:** Full PDF loads within 15 seconds
- [ ] **Check:** Scrolling is smooth without lag
- [ ] **Check:** Zoom functions work properly
- [ ] **Expected:** Acceptable performance on low-end devices

### 3.4 Offline Functionality
- [ ] **Test:** Download PDF and open offline
- [ ] **Check:** PDF opens without internet connection
- [ ] **Check:** All content displays correctly offline
- [ ] **Check:** PDF can be shared via messaging apps
- [ ] **Expected:** Full offline functionality

---

## 4. Invoice Readable in Black & White Testing

### 4.1 Contrast Testing
- [ ] **Test:** Print invoice in black & white mode
- [ ] **Check:** All text is clearly readable
- [ ] **Check:** Headers stand out from body text
- [ ] **Check:** Important information is emphasized
- [ ] **Check:** No information is lost due to poor contrast
- [ ] **Expected:** Excellent readability in grayscale

### 4.2 Table Visibility
- [ ] **Test:** Examine table structure in black & white
- [ ] **Check:** Table borders are clearly visible
- [ ] **Check:** Column separators are distinct
- [ ] **Check:** Row alternation is clear (if used)
- [ ] **Check:** Cell content doesn't blend with borders
- [ ] **Expected:** Clear table structure

### 4.3 Text Hierarchy
- [ ] **Test:** Review text hierarchy in grayscale
- [ ] **Check:** Invoice title is prominently displayed
- [ ] **Check:** Section headers are distinguishable
- [ ] **Check:** Body text is clearly readable
- [ ] **Check:** Fine print is still legible
- [ ] **Expected:** Clear information hierarchy

### 4.4 Color-Independent Information
- [ ] **Test:** Verify no information depends on color
- [ ] **Check:** Status indicators work without color
- [ ] **Check:** Important warnings are visible
- [ ] **Check:** All data is accessible in grayscale
- [ ] **Expected:** Complete information accessibility

### 4.5 Photocopy Quality
- [ ] **Test:** Make photocopy of printed invoice
- [ ] **Check:** Photocopy is clearly readable
- [ ] **Check:** All text remains sharp
- [ ] **Check:** Logo and graphics are recognizable
- [ ] **Check:** No information is lost in copying
- [ ] **Expected:** High-quality reproduction

---

## 5. Logo & Trade License Visible Testing

### 5.1 Logo Visibility
- [ ] **Test:** Print invoice with company logo
- [ ] **Check:** Logo is clearly visible and recognizable
- [ ] **Check:** Logo size is appropriate (not too small/large)
- [ ] **Check:** Logo quality is professional (not pixelated)
- [ ] **Check:** Logo positioning doesn't interfere with text
- [ ] **Expected:** Professional logo presentation

### 5.2 Logo Print Quality
- [ ] **Test:** Examine logo print quality closely
- [ ] **Check:** Logo edges are sharp and clean
- [ ] **Check:** Logo colors print correctly (if color printer)
- [ ] **Check:** Logo is readable in black & white
- [ ] **Check:** Logo maintains aspect ratio
- [ ] **Expected:** High-quality logo reproduction

### 5.3 Trade License Information
- [ ] **Test:** Verify trade license details on invoice
- [ ] **Check:** Trade license number is clearly displayed
- [ ] **Check:** Issue date is visible and readable
- [ ] **Check:** Issuing authority is mentioned
- [ ] **Check:** Business name matches license
- [ ] **Expected:** Complete legal compliance information

### 5.4 Business Credentials Layout
- [ ] **Test:** Review overall business information layout
- [ ] **Check:** Business name is prominently displayed
- [ ] **Check:** Address and contact information is clear
- [ ] **Check:** Trade license info is appropriately positioned
- [ ] **Check:** All information fits without crowding
- [ ] **Expected:** Professional business presentation

### 5.5 Legal Compliance
- [ ] **Test:** Verify legal requirements are met
- [ ] **Check:** All required business information is present
- [ ] **Check:** Trade license information is current
- [ ] **Check:** Contact information is accurate
- [ ] **Check:** Business registration details are included
- [ ] **Expected:** Full legal compliance

---

## Test Results Summary

### Overall Assessment
- [ ] **A4 Print Alignment:** ___/5 scenarios passed
- [ ] **No UI Elements in Print:** ___/4 scenarios passed  
- [ ] **PDF Opens on Low-End Devices:** ___/4 scenarios passed
- [ ] **Invoice Readable in Black & White:** ___/5 scenarios passed
- [ ] **Logo & Trade License Visible:** ___/5 scenarios passed

### Critical Issues Found
1. ________________________________
2. ________________________________
3. ________________________________

### Recommendations
1. ________________________________
2. ________________________________
3. ________________________________

### Sign-off
- [ ] **Tester Name:** ________________
- [ ] **Date:** ________________
- [ ] **Overall Status:** PASS / FAIL
- [ ] **Ready for Production:** YES / NO

---

## Notes
- Test with multiple printer types (inkjet, laser, thermal)
- Test on various paper sizes if business uses different formats
- Verify with actual business logo and trade license information
- Test with real customer data (anonymized)
- Consider testing in different lighting conditions for readability
- Test PDF opening on various devices and browsers
- Verify print quality at different printer settings (draft, normal, high quality)