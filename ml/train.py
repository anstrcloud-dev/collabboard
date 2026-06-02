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
# Load user feedback from database
import psycopg2

data = [
    # HIGH priority — urgent, blocking, critical, deadline, must do now
    ("Fix critical error blocking all users", "Everything is broken, needs immediate fix", "high"),
    ("Urgent: complete before tomorrow deadline", "Deadline is tomorrow, must finish today", "high"),
    ("Important: required for launch", "This must be done before we can launch", "high"),
    ("Emergency fix needed immediately", "Critical issue affecting everyone right now", "high"),
    ("Blocking issue must resolve now", "Team is blocked until this is resolved", "high"),
    ("Required: fix before client meeting", "Client meeting in 2 hours, this must work", "high"),
    ("Critical data loss issue", "Users are losing their data, emergency fix needed", "high"),
    ("Important security vulnerability", "Security breach possible, fix immediately", "high"),
    ("Urgent: payment not working", "No one can pay, revenue loss every minute", "high"),
    ("Must fix before release today", "Release is today and this is broken", "high"),
    ("Critical: service completely down", "Nothing works, all users affected", "high"),
    ("Emergency: fix broken registration", "New users cannot sign up at all", "high"),
    ("Important: deadline in 1 hour", "This must be done in the next hour", "high"),
    ("Blocking everyone on the team", "No one can continue working until fixed", "high"),
    ("Urgent allergy check required", "Must verify allergies before cooking for guests", "high"),
    ("Critical ingredient missing for event", "Event is tomorrow and key ingredient not bought", "high"),
    ("Important: confirm attendance now", "Need headcount urgently for catering order", "high"),
    ("Must submit assignment today", "Assignment due midnight, must complete now", "high"),
    ("Emergency: venue double booked", "Need to find alternative venue immediately", "high"),
    ("Urgent: cancel reservation before charge", "Will be charged if not cancelled in 1 hour", "high"),
    ("Important: medication reminder", "Must take medication at specific time", "high"),
    ("Critical: fix broken oven before dinner", "Dinner party tonight, oven not working", "high"),
    ("Required signature before deadline", "Legal document must be signed today", "high"),
    ("Urgent: inform guests of change", "Event details changed, guests must be notified now", "high"),
    ("Must buy ingredients before store closes", "Store closes in 30 minutes, need ingredients tonight", "high"),
    ("Important: fix leak before it gets worse", "Water leak getting worse, needs immediate attention", "high"),
    ("Urgent: respond to client complaint", "Client very unhappy, needs response today", "high"),
    ("Critical exam preparation", "Exam is tomorrow, must study key topics tonight", "high"),
    ("Must renew license before expiry", "License expires tomorrow, must renew today", "high"),
    ("Important: pick up prescription today", "Prescription ready, need medication tonight", "high"),

    # MEDIUM priority — should do, needs doing, improve, add, schedule
    ("Add email notifications for updates", "Users should be notified when things change", "medium"),
    ("Improve search to be faster", "Search works but is slow, should be improved", "medium"),
    ("Schedule dentist appointment", "Been putting this off, should book this week", "medium"),
    ("Add pagination to long lists", "Lists get slow with many items", "medium"),
    ("Plan weekly meal prep", "Should prepare meals for the week ahead", "medium"),
    ("Write documentation for new feature", "Feature is done but needs to be documented", "medium"),
    ("Fix date formatting issue", "Dates show incorrectly in some cases", "medium"),
    ("Add export to spreadsheet option", "Users have requested this feature", "medium"),
    ("Organize recipe collection", "Recipes are disorganized, should sort them", "medium"),
    ("Schedule team check-in meeting", "Team should meet to discuss progress", "medium"),
    ("Improve loading performance", "Pages load slowly, should be optimized", "medium"),
    ("Update contact information", "Some contact details are outdated", "medium"),
    ("Add user profile settings", "Users need to be able to update their info", "medium"),
    ("Plan birthday party details", "Birthday is next month, need to start planning", "medium"),
    ("Research best practices", "Should research before implementing", "medium"),
    ("Fix mobile layout issues", "Some things look broken on phones", "medium"),
    ("Add dark mode support", "Many users have requested dark theme", "medium"),
    ("Prepare presentation slides", "Presentation is next week, needs preparing", "medium"),
    ("Review and update budget", "Budget should be reviewed monthly", "medium"),
    ("Add keyboard shortcuts", "Would improve productivity for power users", "medium"),
    ("Check inventory and reorder", "Stock is getting low, should reorder soon", "medium"),
    ("Improve error messages", "Current errors are confusing to users", "medium"),
    ("Set up automated backups", "Should have regular backups in place", "medium"),
    ("Plan exercise routine", "Should create a consistent workout schedule", "medium"),
    ("Update project timeline", "Timeline needs to reflect recent changes", "medium"),
    ("Add activity notifications", "Users should see what changed in their projects", "medium"),
    ("Organize files and folders", "File structure is messy, needs reorganizing", "medium"),
    ("Research new tools", "Should evaluate better tools for the team", "medium"),
    ("Create onboarding guide", "New users need better guidance", "medium"),
    ("Follow up with pending requests", "Several requests haven't been responded to", "medium"),

    # LOW priority — nice to have, eventually, minor, cosmetic, optional
    ("Update README file", "Documentation could be more detailed", "low"),
    ("Reorganize folder structure", "Structure works but could be cleaner", "low"),
    ("Add loading animations", "Would be a nice visual improvement", "low"),
    ("Change button colors to match brand", "Minor cosmetic update for consistency", "low"),
    ("Add favicon to website", "Small visual detail that's missing", "low"),
    ("Clean up old unused files", "Some old files taking up space", "low"),
    ("Update footer with correct year", "Footer still shows last year", "low"),
    ("Add tooltips to icons", "Would be helpful but not essential", "low"),
    ("Try new recipe sometime", "Looks interesting, maybe cook it eventually", "low"),
    ("Rearrange furniture layout", "Current layout is fine, just want to try something new", "low"),
    ("Update profile picture", "Current photo is old, nice to update eventually", "low"),
    ("Add more color options", "Current colors are fine, just more variety", "low"),
    ("Watch tutorial video", "Would be nice to learn but not urgent", "low"),
    ("Explore new productivity app", "Might be interesting to try eventually", "low"),
    ("Add social media links", "Nice to have but not critical", "low"),
    ("Clean up email inbox", "Not urgent, just been piling up", "low"),
    ("Update software to latest version", "Current version works fine, minor update available", "low"),
    ("Improve code comments", "Comments could be more detailed", "low"),
    ("Add more examples to documentation", "Docs work but more examples would help", "low"),
    ("Try different coffee brand", "Current one is fine, just curious about others", "low"),
    ("Reorganize bookmarks", "Bookmarks are messy but rarely used", "low"),
    ("Add plant to office", "Would be nice for ambiance eventually", "low"),
    ("Update LinkedIn profile", "Profile is outdated but not urgent", "low"),
    ("Explore new features in tool", "Current usage is fine, just curious", "low"),
    ("Fix minor typo in description", "Small text error, barely noticeable", "low"),
    ("Add more keyboard shortcuts", "Current shortcuts are sufficient", "low"),
    ("Optimize images for faster loading", "Images load fine but could be slightly faster", "low"),
    ("Review old notes", "Notes from months ago, might be useful eventually", "low"),
    ("Add search history feature", "Would be convenient but not needed", "low"),
    ("Try alternative approach", "Current approach works, just exploring options", "low"),
]

# Create DataFrame
df = pd.DataFrame(data, columns=["title", "description", "priority"])
print(f"Dataset size: {len(df)} samples")
print(df["priority"].value_counts())



database_url = os.environ.get("DATABASE_URL")
feedback_rows = []

if database_url:
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT title, description, priority 
            FROM "TrainingFeedback"
            WHERE priority != 'NONE'
        """)
        rows = cursor.fetchall()
        for title, description, priority in rows:
            feedback_rows.append((
                title or "",
                description or "",
                priority.lower()
            ))
        conn.close()
        print(f"Loaded {len(feedback_rows)} feedback entries from database")
    except Exception as e:
        print(f"Could not load feedback: {e}")

# Combine synthetic data with user feedback
if feedback_rows:
    df_feedback = pd.DataFrame(feedback_rows, columns=["title", "description", "priority"])
    df = pd.concat([df, df_feedback], ignore_index=True)
    print(f"Total training samples after feedback: {len(df)}")

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