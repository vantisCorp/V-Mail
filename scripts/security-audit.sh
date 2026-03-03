#!/bin/bash

# Vantis Mail - Security Audit Script
# Runs security checks and generates audit report

set -e

echo "=================================="
echo "Vantis Mail - Security Audit"
echo "=================================="
echo ""

REPORT_FILE="security_audit_report_$(date +%Y%m%d_%H%M%S).txt"
exec > >(tee -a "$REPORT_FILE")

echo "Security Audit Report"
echo "Date: $(date)"
echo "Version: $(node -p "require('./package.json').version")"
echo "=================================="
echo ""

# Check for vulnerabilities in dependencies
echo "1. Checking for npm vulnerabilities..."
npm audit --audit-level=moderate || true
echo ""

# Check for outdated dependencies
echo "2. Checking for outdated dependencies..."
npm outdated || echo "No outdated dependencies found"
echo ""

# Run linter to check for code quality issues
echo "3. Running linter..."
npm run lint || true
echo ""

# Check for secrets in the codebase
echo "4. Checking for exposed secrets..."
if grep -r "password\|secret\|api_key\|private_key" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ | grep -v "node_modules" | grep -v ".test" | grep -v ".spec"; then
    echo "WARNING: Potential secrets found in codebase"
else
    echo "No exposed secrets found"
fi
echo ""

# Check for hardcoded credentials
echo "5. Checking for hardcoded credentials..."
if grep -rE "(http://|https://)[a-zA-Z0-9]+:[a-zA-Z0-9]+@" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ | grep -v "node_modules"; then
    echo "WARNING: Hardcoded credentials found"
else
    echo "No hardcoded credentials found"
fi
echo ""

# Check file permissions
echo "6. Checking file permissions..."
find . -type f -name "*.key" -o -name "*.pem" -o -name "*.cert" 2>/dev/null | while read file; do
    if [ -f "$file" ]; then
        perms=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%OLp" "$file" 2>/dev/null)
        echo "File: $file, Permissions: $perms"
        if [ "$perms" != "600" ] && [ "$perms" != "400" ]; then
            echo "WARNING: Insecure permissions on $file"
        fi
    fi
done
echo ""

# Check for SQL injection vulnerabilities (basic check)
echo "7. Checking for potential SQL injection vulnerabilities..."
if grep -rE "(SELECT|INSERT|UPDATE|DELETE).*\$[a-zA-Z]" --include="*.rs" backend/src/ | grep -v "node_modules"; then
    echo "WARNING: Potential SQL injection vulnerabilities found"
else
    echo "No obvious SQL injection vulnerabilities found"
fi
echo ""

# Check for XSS vulnerabilities (basic check)
echo "8. Checking for potential XSS vulnerabilities..."
if grep -r "dangerouslySetInnerHTML" --include="*.tsx" --include="*.ts" src/ | grep -v "node_modules"; then
    echo "WARNING: Potential XSS vulnerabilities found"
else
    echo "No obvious XSS vulnerabilities found"
fi
echo ""

# Run backend security checks
echo "9. Running backend security checks..."
cd backend
cargo clippy -- -W clippy::all 2>&1 | head -50 || true
cd ..
echo ""

echo "=================================="
echo "Security Audit Completed"
echo "=================================="
echo "Report saved to: $REPORT_FILE"
echo ""

echo "Summary:"
echo "- Review the report for any security issues"
echo "- Address any high-priority vulnerabilities"
echo "- Keep dependencies updated"
echo "- Regular security audits are recommended"
echo ""