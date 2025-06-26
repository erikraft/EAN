# EAN Barcode Generator & Scanner

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

A comprehensive web application for generating, validating, and looking up product information using barcodes (EAN, UPC, ISBN) and QR codes. This tool supports multiple barcode formats and integrates with various product databases to provide detailed product information.

## 🌟 Features

### 🏷️ Barcode Generation
- Generate EAN-8, EAN-13, UPC-A, and other standard barcode formats
- Create custom barcodes with country-specific prefixes
- Support for ISBN-10 and ISBN-13 book codes
- Generate barcodes with customizable parameters

### 🔍 Barcode Lookup
- Search product information using barcode numbers
- Integration with multiple product databases:
  - Open Food Facts
  - UPC ItemDB
  - Google Shopping
  - World Wide Open Product Database
  - Google Books (for ISBN)
  - Open Library (for ISBN)
- Display detailed product information including:
  - Product name and description
  - Brand and manufacturer
  - Category and packaging
  - Images and nutritional information (when available)

### 📱 Barcode Scanner
- Real-time barcode scanning using device camera
- Support for multiple barcode formats
- Responsive design that works on both desktop and mobile devices
- Automatic barcode detection and processing

### 🛠️ Conversion Tools
- Convert between different barcode formats
- Normalize barcodes to standard formats
- Calculate and validate check digits
- Support for various country-specific prefixes

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm (Node Package Manager)
- Modern web browser with camera access (for barcode scanning)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/erikraft/EAN.git
   cd EAN
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## 🛠️ Technologies Used

- **Frontend**:
  - HTML5, CSS3, JavaScript (ES6+)
  - Responsive design with CSS Grid and Flexbox
  - QuaggaJS for barcode scanning
  - Font Awesome for icons
  - Google Fonts for typography

- **Backend**:
  - Node.js with Express
  - Axios for API requests
  - CORS for cross-origin resource sharing
  - Environment variables for configuration

## 🌐 API Integration

The application integrates with the following APIs:
- Open Food Facts API
- UPC ItemDB API
- Google Shopping API (via RapidAPI)
- Google Books API
- Open Library API
- World Wide Open Product Database

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers with camera access

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all the open-source projects and APIs that made this application possible
- Special thanks to the contributors of QuaggaJS for the barcode scanning library
- Icons by Font Awesome
- Fonts by Google Fonts

## 📧 Contact

For any questions or feedback, please open an issue on the [GitHub repository](https://github.com/erikraft/EAN).

---

Made with ❤️ by ErikrafT
