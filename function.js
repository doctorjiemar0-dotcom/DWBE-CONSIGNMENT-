/**
 * Security Utility Functions
 * Doctor's Whisk Broom Consignment Portal
 * Version: 2.0
 */

// ============================================
// 1. INPUT VALIDATION FUNCTIONS
// ============================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} Validation result
 */
function validateEmail(email) {
  const cleanEmail = email.trim().toLowerCase();
  
  // RFC 5322 simplified regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const validation = {
    isValid: false,
    email: cleanEmail,
    errors: []
  };

  // Length check
  if (cleanEmail.length > 254) {
    validation.errors.push('Email is too long (max 254 characters)');
  }

  // Format check
  if (!emailRegex.test(cleanEmail)) {
    validation.errors.push('Invalid email format');
  }

  // Additional checks
  if (cleanEmail.includes('..')) {
    validation.errors.push('Email cannot contain consecutive dots');
  }

  if (cleanEmail.startsWith('.') || cleanEmail.endsWith('.')) {
    validation.errors.push('Email cannot start or end with a dot');
  }

  validation.isValid = validation.errors.length === 0;
  return validation;
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with feedback
 */
function validatePassword(password) {
  const validation = {
    isValid: false,
    password: password,
    requirements: {
      minLength: password.length >= 12,
      maxLength: password.length <= 128,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      noConsecutiveChars: !/(.)\\1{2,}/.test(password),
      noCommonPatterns: !isCommonPattern(password)
    },
    feedback: [],
    strength: 'Weak'
  };

  // Generate feedback
  if (!validation.requirements.minLength) {
    validation.feedback.push('Minimum 12 characters required');
  }
  if (!validation.requirements.maxLength) {
    validation.feedback.push('Maximum 128 characters allowed');
  }
  if (!validation.requirements.hasUppercase) {
    validation.feedback.push('At least one uppercase letter (A-Z)');
  }
  if (!validation.requirements.hasLowercase) {
    validation.feedback.push('At least one lowercase letter (a-z)');
  }
  if (!validation.requirements.hasNumbers) {
    validation.feedback.push('At least one number (0-9)');
  }
  if (!validation.requirements.hasSpecialChar) {
    validation.feedback.push('At least one special character (!@#$%^&*)');
  }
  if (!validation.requirements.noConsecutiveChars) {
    validation.feedback.push('Cannot have 3+ consecutive identical characters');
  }
  if (!validation.requirements.noCommonPatterns) {
    validation.feedback.push('Password too common or predictable');
  }

  // Check if all requirements met
  validation.isValid = Object.values(validation.requirements).every(v => v === true);

  // Calculate strength
  if (validation.isValid) {
    const metRequirements = Object.values(validation.requirements).filter(v => v).length;
    if (metRequirements === 8) {
      validation.strength = 'Strong';
    } else if (metRequirements >= 6) {
      validation.strength = 'Medium';
    }
  }

  return validation;
}

/**
 * Check if password matches common patterns
 * @param {string} password - Password to check
 * @returns {boolean} True if common pattern detected
 */
function isCommonPattern(password) {
  const commonPatterns = [
    'password', 'admin', '123456', 'qwerty', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'sunshine',
    'princess', 'football', 'trustno1', 'shadow', 'michael'
  ];

  const lowerPassword = password.toLowerCase();
  return commonPatterns.some(pattern => lowerPassword.includes(pattern));
}

/**
 * Validate store name
 * @param {string} storeName - Store name to validate
 * @returns {object} Validation result
 */
function validateStoreName(storeName) {
  const cleanName = storeName.trim();
  
  const validation = {
    isValid: false,
    storeName: cleanName,
    errors: []
  };

  if (cleanName.length < 2) {
    validation.errors.push('Store name must be at least 2 characters');
  }

  if (cleanName.length > 100) {
    validation.errors.push('Store name cannot exceed 100 characters');
  }

  // Only allow alphanumeric, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z0-9\s\-']+$/.test(cleanName)) {
    validation.errors.push('Store name can only contain letters, numbers, spaces, hyphens, and apostrophes');
  }

  if (/^[\d\-\s]+$/.test(cleanName)) {
    validation.errors.push('Store name must contain at least one letter');
  }

  validation.isValid = validation.errors.length === 0;
  return validation;
}

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {object} Validation result
 */
function validatePhoneNumber(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  
  const validation = {
    isValid: false,
    phone: cleanPhone,
    errors: []
  };

  // Philippines: 10-11 digits starting with 09 or +63
  if (!/^(09|\+639)\d{9}$/.test(phone.replace(/\D/g, '0'))) {
    validation.errors.push('Invalid Philippine phone number format');
  }

  if (cleanPhone.length < 10) {
    validation.errors.push('Phone number too short');
  }

  if (cleanPhone.length > 15) {
    validation.errors.push('Phone number too long');
  }

  validation.isValid = validation.errors.length === 0;
  return validation;
}

// ============================================
// 2. INPUT SANITIZATION FUNCTIONS
// ============================================

/**
 * Sanitize email input
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
function sanitizeEmail(email) {
  return email
    .trim()
    .toLowerCase()
    .replace(/[^\w@.-]/g, '');
}

/**
 * Sanitize store name
 * @param {string} name - Name to sanitize
 * @returns {string} Sanitized name
 */
function sanitizeStoreName(name) {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\s\-']/g, '')
    .replace(/\s+/g, ' ') // Remove extra spaces
    .slice(0, 100);
}

/**
 * Sanitize text input
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeText(text) {
  return text
    .trim()
    .replace(/[<>\"'&]/g, (char) => {
      const escapeMap = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[char];
    })
    .slice(0, 500);
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// 3. SECURITY TOKEN FUNCTIONS
// ============================================

/**
 * Generate CSRF token
 * @returns {string} CSRF token
 */
function generateCSRFToken() {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  sessionStorage.setItem('_csrf_token', token);
  return token;
}

/**
 * Get CSRF token from storage
 * @returns {string} CSRF token
 */
function getCSRFToken() {
  return sessionStorage.getItem('_csrf_token') || '';
}

/**
 * Validate CSRF token
 * @param {string} token - Token to validate
 * @returns {boolean} True if valid
 */
function validateCSRFToken(token) {
  const stored = getCSRFToken();
  return stored === token && token.length > 0;
}

/**
 * Generate secure random token (client-side)
 * @param {number} length - Token length in characters
 * @returns {string} Random token
 */
function generateSecureToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars[array[i] % chars.length];
  }
  return token;
}

// ============================================
// 4. SESSION MANAGEMENT
// ============================================

/**
 * Create secure session
 * @param {object} data - Session data
 */
function createSession(data) {
  const session = {
    ...data,
    createdAt: new Date().getTime(),
    expiresAt: new Date().getTime() + (30 * 60 * 1000), // 30 minutes
    csrfToken: generateCSRFToken()
  };

  // Store only essential data in sessionStorage (not passwords!)
  sessionStorage.setItem('_session_data', JSON.stringify({
    email: data.email,
    storeName: data.storeName,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt
  }));

  return session;
}

/**
 * Get current session
 * @returns {object|null} Session data or null
 */
function getSession() {
  const data = sessionStorage.getItem('_session_data');
  if (!data) return null;

  const session = JSON.parse(data);
  const now = new Date().getTime();

  // Check if session expired
  if (now > session.expiresAt) {
    clearSession();
    return null;
  }

  return session;
}

/**
 * Check if session is valid
 * @returns {boolean} True if valid session exists
 */
function isSessionValid() {
  return getSession() !== null;
}

/**
 * Extend session expiration
 */
function extendSession() {
  const session = getSession();
  if (session) {
    session.expiresAt = new Date().getTime() + (30 * 60 * 1000);
    sessionStorage.setItem('_session_data', JSON.stringify(session));
  }
}

/**
 * Clear session
 */
function clearSession() {
  sessionStorage.removeItem('_session_data');
  sessionStorage.removeItem('_csrf_token');
  localStorage.removeItem('auth_token');
}

/**
 * Check session timeout and auto-logout
 */
function checkSessionTimeout() {
  const session = getSession();
  
  if (!session) {
    return;
  }

  const now = new Date().getTime();
  const timeUntilExpiry = session.expiresAt - now;

  // Warn user 5 minutes before expiry
  if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
    showSessionWarning(Math.floor(timeUntilExpiry / 1000));
  }

  // Auto logout on expiry
  if (timeUntilExpiry <= 0) {
    clearSession();
    window.location.href = '/index.html?session=expired';
  }
}

/**
 * Show session warning to user
 * @param {number} secondsRemaining - Seconds until logout
 */
function showSessionWarning(secondsRemaining) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  
  const warning = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fff3cd;
      border: 2px solid #ffc107;
      padding: 15px;
      border-radius: 8px;
      z-index: 9999;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    ">
      <strong style="color: #f57f17;">⚠️ Session Expiring</strong>
      <p style="margin: 8px 0 0 0; color: #333;">
        Your session will expire in ${minutes}m ${seconds}s
      </p>
      <button onclick="extendSession()" style="
        background: #2e7d32;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 8px;
        font-weight: bold;
      ">Continue Session</button>
    </div>
  `;

  const container = document.getElementById('sessionWarning');
  if (container) {
    container.innerHTML = warning;
  }
}

// ============================================
// 5. PASSWORD STRENGTH INDICATOR
// ============================================

/**
 * Create password strength indicator
 * @param {string} containerId - ID of container element
 */
function initPasswordStrengthIndicator(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const passwordInput = container.querySelector('input[type="password"]');
  if (!passwordInput) return;

  passwordInput.addEventListener('input', (e) => {
    const validation = validatePassword(e.target.value);
    
    const indicator = container.querySelector('.password-strength') || 
      createPasswordStrengthDisplay(container);

    updatePasswordStrengthDisplay(indicator, validation);
  });
}

/**
 * Create password strength display element
 * @param {Element} container - Container element
 * @returns {Element} Strength indicator element
 */
function createPasswordStrengthDisplay(container) {
  const indicator = document.createElement('div');
  indicator.className = 'password-strength';
  indicator.style.cssText = `
    margin-top: 8px;
    padding: 10px;
    border-radius: 4px;
    background: #f5f5f5;
    font-size: 0.85rem;
  `;
  container.appendChild(indicator);
  return indicator;
}

/**
 * Update password strength display
 * @param {Element} indicator - Indicator element
 * @param {object} validation - Validation result
 */
function updatePasswordStrengthDisplay(indicator, validation) {
  const requirements = validation.requirements;
  const metCount = Object.values(requirements).filter(v => v).length;
  const totalCount = Object.keys(requirements).length;

  let color = '#d32f2f'; // Weak
  if (validation.strength === 'Medium') color = '#f57c00';
  if (validation.strength === 'Strong') color = '#2e7d32';

  let html = `
    <div style="color: ${color}; font-weight: bold; margin-bottom: 6px;">
      Strength: ${validation.strength} (${metCount}/${totalCount})
    </div>
    <div style="font-size: 0.8rem;">
  `;

  // Checklist of requirements
  const checkmarks = {
    'minLength': 'At least 12 characters',
    'maxLength': 'Maximum 128 characters',
    'hasUppercase': 'Uppercase letter (A-Z)',
    'hasLowercase': 'Lowercase letter (a-z)',
    'hasNumbers': 'Number (0-9)',
    'hasSpecialChar': 'Special character (!@#$%)',
    'noConsecutiveChars': 'No 3+ same characters',
    'noCommonPatterns': 'Not a common pattern'
  };

  for (const [key, label] of Object.entries(checkmarks)) {
    const met = requirements[key];
    const symbol = met ? '✓' : '○';
    const style = met ? 'color: #2e7d32;' : 'color: #ccc;';
    html += `<div style="${style}"><small>${symbol} ${label}</small></div>`;
  }

  html += '</div>';
  indicator.innerHTML = html;
}

// ============================================
// 6. LOGIN ATTEMPT TRACKING
// ============================================

/**
 * Track failed login attempt
 * @param {string} email - Email of failed attempt
 * @param {string} reason - Reason for failure
 */
function trackFailedAttempt(email, reason) {
  const key = `login_attempts_${email}`;
  const data = JSON.parse(localStorage.getItem(key) || '{"count":0,"timestamp":0,"reasons":[]}');
  
  data.count++;
  data.timestamp = new Date().getTime();
  data.reasons = data.reasons.slice(-4); // Keep last 5 reasons
  data.reasons.push({
    reason: reason,
    time: new Date().toLocaleString()
  });

  localStorage.setItem(key, JSON.stringify(data));
  return data;
}

/**
 * Get login attempt count
 * @param {string} email - Email to check
 * @returns {object} Attempt data
 */
function getAttemptCount(email) {
  const key = `login_attempts_${email}`;
  const data = JSON.parse(localStorage.getItem(key) || '{"count":0,"timestamp":0}');
  
  // Reset if more than 15 minutes old
  if (new Date().getTime() - data.timestamp > 15 * 60 * 1000) {
    localStorage.removeItem(key);
    return { count: 0, timestamp: 0, reasons: [] };
  }

  return data;
}

/**
 * Reset login attempts
 * @param {string} email - Email to reset
 */
function resetAttempts(email) {
  const key = `login_attempts_${email}`;
  localStorage.removeItem(key);
}

// ============================================
// 7. SECURITY MONITORING
// ============================================

/**
 * Log security event
 * @param {object} event - Event data
 */
async function logSecurityEvent(event) {
  try {
    const logData = {
      timestamp: new Date().toISOString(),
      type: event.type,
      severity: event.severity || 'INFO',
      details: event.details || {},
      userAgent: navigator.userAgent,
      language: navigator.language
    };

    // Send to backend (requires server endpoint)
    await fetch('/api/security/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCSRFToken()
      },
      body: JSON.stringify(logData)
    }).catch(err => {
      // Fail silently if logging endpoint not available
      console.debug('Security log not sent:', err);
    });
  } catch (error) {
    console.debug('Logging error:', error);
  }
}

/**
 * Monitor for suspicious activity
 */
function initSecurityMonitoring() {
  // Monitor for right-click (optional - for sensitive apps)
  // document.addEventListener('contextmenu', (e) => {
  //   logSecurityEvent({
  //     type: 'CONTEXT_MENU_OPENED',
  //     severity: 'LOW'
  //   });
  // });

  // Monitor for console access (optional)
  // setInterval(() => {
  //   if (window.devtools?.open) {
  //     logSecurityEvent({
  //       type: 'DEVELOPER_TOOLS_OPEN',
  //       severity: 'MEDIUM'
  //     });
  //   }
  // }, 1000);

  // Monitor for suspicious timing patterns
  // (multiple rapid login attempts from same IP)
  setInterval(() => {
    checkSessionTimeout();
  }, 60000); // Check every minute
}

// ============================================
// 8. INITIALIZATION
// ============================================

/**
 * Initialize all security features
 */
function initializeSecurityFeatures() {
  // Generate CSRF token
  generateCSRFToken();

  // Start session timeout monitoring
  initSecurityMonitoring();

  // Log page visit
  logSecurityEvent({
    type: 'PAGE_LOAD',
    severity: 'INFO',
    details: {
      page: window.location.pathname
    }
  });
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSecurityFeatures);
} else {
  initializeSecurityFeatures();
}

// ============================================
// EXPORTS (for use in other scripts)
// ============================================

// Module pattern for organization
const SecurityModule = {
  validation: {
    email: validateEmail,
    password: validatePassword,
    storeName: validateStoreName,
    phone: validatePhoneNumber
  },
  sanitization: {
    email: sanitizeEmail,
    storeName: sanitizeStoreName,
    text: sanitizeText,
    html: escapeHtml
  },
  tokens: {
    generateCSRF: generateCSRFToken,
    getCSRF: getCSRFToken,
    validateCSRF: validateCSRFToken,
    generate: generateSecureToken
  },
  session: {
    create: createSession,
    get: getSession,
    isValid: isSessionValid,
    extend: extendSession,
    clear: clearSession,
    checkTimeout: checkSessionTimeout
  },
  logging: {
    trackFailedAttempt: trackFailedAttempt,
    getAttemptCount: getAttemptCount,
    resetAttempts: resetAttempts,
    logEvent: logSecurityEvent
  }
};
