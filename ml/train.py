# Loads 90 carefully labeled task examples we wrote
# Converts text to numbers using TF-IDF
# Trains a Random Forest model on those examples
# Saves the trained model to ml/model/priority_model.pkl
# Run this ONCE to train, then never again (unless you want to retrain)



import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

# High quality synthetic training data
# Based on real patterns from software engineering task management
data = [
    # HIGH priority — urgent, blocking, production issues
    ("Production server is down", "Users cannot access the application", "high"),
    ("Critical security vulnerability found", "SQL injection in login form allows data breach", "high"),
    ("Payment processing failing", "Stripe API returning 500, users cannot checkout", "high"),
    ("Database connection pool exhausted", "App crashes under load, all requests failing", "high"),
    ("Authentication bypass bug", "Users can access admin panel without credentials", "high"),
    ("Data loss on save", "User records being overwritten silently", "high"),
    ("API returning 500 errors", "Core endpoints down, affecting all users", "high"),
    ("SSL certificate expired", "Site showing security warning, users leaving", "high"),
    ("Memory leak causing crashes", "Server runs out of memory every 2 hours", "high"),
    ("GDPR compliance violation", "User data stored without consent, legal risk", "high"),
    ("Checkout flow broken", "Users cannot complete purchases, revenue loss", "high"),
    ("Login not working on mobile", "50% of mobile users locked out", "high"),
    ("Race condition in payments", "Duplicate charges being made to customers", "high"),
    ("XSS vulnerability in comments", "Malicious scripts executing in user browsers", "high"),
    ("Email notifications not sending", "Password reset emails not delivered, users locked out", "high"),
    ("File uploads corrupting data", "Uploaded files unreadable after save", "high"),
    ("Search returning wrong results", "Critical search feature returning irrelevant data", "high"),
    ("Session hijacking vulnerability", "Attacker can steal user sessions", "high"),
    ("Backup system failing silently", "No backups made for 5 days, data at risk", "high"),
    ("Third party API key exposed", "API credentials visible in public repository", "high"),
    ("Infinite loop in data processing", "Server CPU at 100% blocking all requests", "high"),
    ("User passwords stored in plaintext", "Security audit found passwords not hashed", "high"),
    ("Critical dependency vulnerability", "npm audit shows critical CVE in production dependency", "high"),
    ("Two factor auth broken", "Users cannot log in with 2FA enabled", "high"),
    ("Production deploy failed", "Latest release broke main feature for all users", "high"),
    ("Database migration failed", "Schema update left tables in broken state", "high"),
    ("Rate limiting not working", "DDoS attack succeeding, server overloaded", "high"),
    ("Sensitive data in logs", "User emails and tokens appearing in log files", "high"),
    ("CSRF token validation broken", "Cross site request forgery attacks possible", "high"),
    ("Real time sync not working", "Collaborative editing causing data conflicts", "high"),

    # MEDIUM priority — important but not blocking
    ("Add email notifications for task assignment", "Notify users when tasks are assigned to them", "medium"),
    ("Improve search performance", "Search taking more than 3 seconds on large datasets", "medium"),
    ("Add pagination to task list", "List becomes slow with more than 100 tasks", "medium"),
    ("Fix date formatting in different timezones", "Dates show incorrectly for users outside UTC", "medium"),
    ("Add export to CSV feature", "Users want to export their project data", "medium"),
    ("Implement task filtering by status", "Users need to filter tasks by column", "medium"),
    ("Add user profile settings page", "Users need to update name email and password", "medium"),
    ("Fix image upload size validation", "Large images cause timeout errors", "medium"),
    ("Add keyboard shortcuts", "Power users requesting faster navigation", "medium"),
    ("Improve error messages", "Generic error messages confusing users", "medium"),
    ("Add dark mode", "Multiple user requests for dark theme", "medium"),
    ("Fix mobile layout on small screens", "Some pages overflow on phones", "medium"),
    ("Add activity log for projects", "Users want to see history of changes", "medium"),
    ("Implement due date reminders", "Send notifications before task deadlines", "medium"),
    ("Add task comments feature", "Users need to discuss tasks inline", "medium"),
    ("Fix sorting on task list", "Sort by date not working correctly", "medium"),
    ("Add bulk task operations", "Users want to move multiple tasks at once", "medium"),
    ("Improve loading performance", "Dashboard takes 5 seconds to load", "medium"),
    ("Add task priority field", "Users want to manually set task importance", "medium"),
    ("Fix broken links in emails", "Email notification links returning 404", "medium"),
    ("Add project archive feature", "Users want to hide completed projects", "medium"),
    ("Implement search within project", "Users need to find specific tasks quickly", "medium"),
    ("Add member role management", "Admins need to change member permissions", "medium"),
    ("Fix drag and drop on touch devices", "Kanban board drag not working on iPad", "medium"),
    ("Add task assignment notifications", "Notify assignee when task is assigned", "medium"),
    ("Improve API response times", "Some endpoints taking over 2 seconds", "medium"),
    ("Add project description field", "Projects need more context than just name", "medium"),
    ("Fix timezone handling in reports", "Report dates wrong for international users", "medium"),
    ("Add recurring tasks feature", "Users need weekly and monthly repeating tasks", "medium"),
    ("Implement data export for GDPR", "Users need to download all their data", "medium"),

    # LOW priority — nice to have, cosmetic, minor
    ("Update README documentation", "Add clearer setup instructions for new developers", "low"),
    ("Refactor CSS to use variables", "Replace hardcoded colors with CSS custom properties", "low"),
    ("Add code comments to utils", "Helper functions need documentation", "low"),
    ("Upgrade to latest dependencies", "Several packages have minor version updates available", "low"),
    ("Add loading spinner animation", "Use brand colors instead of default spinner", "low"),
    ("Change primary button color", "Marketing wants buttons to match new brand guide", "low"),
    ("Add favicon to browser tab", "App is missing a favicon", "low"),
    ("Remove unused CSS classes", "Dead styles adding unnecessary bundle size", "low"),
    ("Update footer copyright year", "Footer still shows 2023", "low"),
    ("Add tooltips to icon buttons", "Some icon buttons have no labels", "low"),
    ("Reorganize component folder structure", "Components folder getting messy", "low"),
    ("Write unit tests for utility functions", "Increase test coverage for helper modules", "low"),
    ("Update color palette documentation", "Design tokens doc is outdated", "low"),
    ("Fix typos in onboarding text", "Several spelling mistakes in welcome flow", "low"),
    ("Add placeholder text to empty states", "Empty boards show blank space", "low"),
    ("Improve console error messages", "Dev errors are hard to debug", "low"),
    ("Add missing alt text to images", "Accessibility improvement for screen readers", "low"),
    ("Clean up unused environment variables", "Several env vars no longer referenced", "low"),
    ("Update API documentation", "Swagger docs missing some new endpoints", "low"),
    ("Add ESLint rule for console logs", "Prevent accidental console.log in production", "low"),
    ("Rename confusing variable names", "Some variables have misleading names", "low"),
    ("Add git hooks for linting", "Prevent bad code from being committed", "low"),
    ("Move hardcoded strings to constants", "Magic strings scattered throughout codebase", "low"),
    ("Add storybook for UI components", "Document reusable components visually", "low"),
    ("Update project license file", "License year needs updating", "low"),
    ("Add contributing guide", "New contributors need guidance", "low"),
    ("Compress images in public folder", "Some images are unnecessarily large", "low"),
    ("Add browser compatibility note to README", "Users asking about Firefox support", "low"),
    ("Fix inconsistent button padding", "Some buttons have different padding values", "low"),
    ("Add scroll to top button", "Long pages need easy navigation back to top", "low"),
]

# Create DataFrame
df = pd.DataFrame(data, columns=["title", "description", "priority"])
print(f"Dataset size: {len(df)} samples")
print(df["priority"].value_counts())

# Combine title and description as features
df["text"] = df["title"] + " " + df["description"]

# Feature extraction with TF-IDF
print("\nExtracting features...")
vectorizer = TfidfVectorizer(max_features=500, ngram_range=(1, 2), stop_words="english")
X = vectorizer.fit_transform(df["text"])
y = df["priority"]

# Split into train/test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training on {X_train.shape[0]} samples, testing on {X_test.shape[0]} samples")

# Train Random Forest
print("\nTraining model...")
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced"
)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print("\nModel Performance:")
print(classification_report(y_test, y_pred))

# Save model and vectorizer
os.makedirs("ml/model", exist_ok=True)
joblib.dump(model, "ml/model/priority_model.pkl")
joblib.dump(vectorizer, "ml/model/vectorizer.pkl")
print("\nModel saved to ml/model/")