from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
import joblib
import datetime
import os
import uuid
from typing import Dict, List, Optional
from werkzeug.utils import secure_filename
import json
import re
import functools
import jwt
import bleach
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)
CORS(app)  # Allow frontend to communicate with Flask

from ml_engine import GrievixML

# Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = "municipal_complaints"
COLLECTION_NAME = "complaints"
MODEL_VERSION = "1.4.0"

# Configure upload folder for complaint photos
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024 
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Security Configuration
app.config['SECRET_KEY'] = os.getenv("JWT_SECRET", "grievix_super_secret_key_2026")
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Initialize DB collections as None
db = None
complaints_collection = None
activity_collection = None
security_logs_collection = None

# Connect to MongoDB
try:
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    complaints_collection = db[COLLECTION_NAME]
    activity_collection = db["activity"]
    security_logs_collection = db["security_logs"]
    users_collection = db["users"]  # User collection
    print("✅ MongoDB connected successfully!")
except Exception as e:
    print(f"❌ MongoDB connection error: {e}")

# Define paths for ML components
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "random_forest_model_retrained.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "tfidf_vectorizer_retrained.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "label_encoder_retrained.pkl")

# Initialize the new ML engine
ml_engine = GrievixML(MODEL_PATH, VECTORIZER_PATH, ENCODER_PATH)

# Re-assign for backward compatibility if needed, but we'll use ml_engine mostly
model = ml_engine.model
tfidf_vectorizer = ml_engine.tfidf_vectorizer
label_encoder = ml_engine.label_encoder

# Define your categories and keywords
CATEGORIES = [
    "Water Issues",
    "Road Issues",
    "Garbage Issues",
    "Electricity",
    "Drainage Issues",
    "Other"
]

# Enhanced category mapping with more keywords
CATEGORY_KEYWORDS = {
    "Water Issues": ["water", "drinking", "supply", "leak", "pipe", "tap", "smell", "taste", "pressure"],
    "Road Issues": ["road", "pothole", "asphalt", "street", "highway", "repair", "damage", "construction"],
    "Garbage Issues": ["garbage", "trash", "waste", "collection", "dump", "bin", "clean", "disposal"],
    "Electricity": ["electricity", "power", "outage", "blackout", "wire", "transformer", "voltage", "flickering"],
    "Drainage Issues": ["drainage", "sewer", "flood", "waterlogging", "blockage", "clog", "overflow"],
    "Other": ["noise", "loudspeaker", "park", "tree", "animal", "stray", "public", "nuisance"]
}

def manual_category_detection(complaint_text: str) -> Optional[str]:
    """Check if complaint should be manually categorized based on keywords"""
    complaint_text = complaint_text.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in complaint_text for kw in keywords):
            return category
    return None

def validate_prediction(predicted: str, text: str) -> str:
    """Extra validation layer for AI predictions"""
    text_lower = text.lower()
    
    # If the model predicts "Water Issues" but text contains "garbage", correct it
    if "garbage" in text_lower or "trash" in text_lower:
        return "Garbage Issues"
    if "pothole" in text_lower or "road" in text_lower:
        return "Road Issues"
    if "leak" in text_lower or "water" in text_lower:
        return "Water Issues"
    if "electricity" in text_lower or "shock" in text_lower or "power" in text_lower:
        return "Electricity"
    if "drainage" in text_lower or "sewer" in text_lower:
        return "Drainage Issues"
        
    return predicted if predicted in CATEGORIES else "Other"

# Security Middleware & Decorators
def log_security_event(action, status, message):
    """Log security-related events to MongoDB."""
    try:
        log_entry = {
            "ip": request.remote_addr,
            "timestamp": datetime.datetime.utcnow(),
            "action": action,
            "status": status,
            "message": message,
            "user_agent": request.headers.get('User-Agent')
        }
        security_logs_collection.insert_one(log_entry)
    except:
        pass

def sanitize_content(text):
    """Sanitize input to prevent XSS and injection."""
    if not text: return ""
    # Remove HTML tags using bleach
    clean_text = bleach.clean(text, tags=[], attributes={}, strip=True)
    # Basic NoSQL injection prevention
    clean_text = re.sub(r'[\$\{\}]', '', clean_text)
    return clean_text.strip()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def admin_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token.split(" ")[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            if data.get('role') != 'admin':
                return jsonify({'error': 'Admin privilege required!'}), 403
        except Exception as e:
            return jsonify({'error': 'Token is invalid or expired!'}), 401
        
        return f(*args, **kwargs)
    return decorated

@app.before_request
def basic_firewall():
    """Simple firewall to block suspicious IPs."""
    # Mock blocked IPs list (in a real app, this would be in DB/Redis)
    BLOCKED_IPS = ["1.2.3.4", "9.9.9.9"]
    if request.remote_addr in BLOCKED_IPS:
        log_security_event("firewall_block", "denied", f"Blocked IP {request.remote_addr} tried to access")
        return jsonify({"error": "Access denied by security firewall"}), 403

@app.route("/api/register", methods=["POST"])
@limiter.limit("3 per hour")
def register():
    """User registration endpoint"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400
            
        if users_collection.find_one({"email": email}):
            return jsonify({"error": "User already exists"}), 400
            
        user_entry = {
            "fullName": data.get('fullName'),
            "email": email,
            "password": password,  # In production, use hashed passwords!
            "role": "user",
            "created_at": datetime.datetime.utcnow(),
            "address": data.get('address'),
            "district": data.get('district'),
            "pincode": data.get('pincode'),
            "phone": data.get('phone')
        }
        users_collection.insert_one(user_entry)
        log_security_event("registration", "success", f"User {email} registered")
        return jsonify({"success": True, "message": "User registered successfully"})
    except Exception as e:
        print(f"❌ Error in register: {e}")
        return jsonify({"error": "Registration failed"}), 500

@app.route("/api/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    """Secure login endpoint issuing JWT."""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        # 1. Check Hardcoded Admin
        if email == "admin@grievix.com" and password == "admin123":
            token = jwt.encode({
                'user': email,
                'role': 'admin',
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=12)
            }, app.config['SECRET_KEY'], algorithm="HS256")
            
            # Handle potential bytes from old PyJWT
            if isinstance(token, bytes):
                token = token.decode('utf-8')
                
            log_security_event("login", "success", f"Admin {email} logged in")
            return jsonify({'token': token, 'role': 'admin', 'email': email})

        # 2. Check Database Users
        user = users_collection.find_one({"email": email, "password": password})
        if user:
            token = jwt.encode({
                'user': email,
                'role': 'user',
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, app.config['SECRET_KEY'], algorithm="HS256")
            
            if isinstance(token, bytes):
                token = token.decode('utf-8')
                
            log_security_event("login", "success", f"User {email} logged in")
            return jsonify({
                'token': token, 
                'role': 'user', 
                'email': email,
                'fullName': user.get('fullName')
            })
        
        log_security_event("login", "failed", f"Failed attempt for {email}")
        return jsonify({'error': 'Invalid credentials!'}), 401
    except Exception as e:
        print(f"❌ Error in login: {e}")
        return jsonify({"error": "Login failed"}), 500

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "active",
        "model_version": MODEL_VERSION,
        "endpoints": [
            "/submit_complaint", 
            "/get_categories", 
            "/get_complaints",
            "/update_status",
            "/assign_department"
        ],
        "categories": CATEGORIES
    })

@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    """Serve uploaded complaint photos"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route("/predict_category", methods=["POST"])
def predict_category():
    """Endpoint to predict category without saving the complaint"""
    try:
        data = request.json
        complaint_text = ""
        if data is not None:
            complaint_text = data.get("complaint", "").strip()
        else:
            complaint_text = ""

        if len(complaint_text) < 10:
            return jsonify({"error": "Complaint must be at least 10 characters"}), 400

        # First try manual categorization
        manual_category = manual_category_detection(complaint_text.lower())
        
        if manual_category:
            predicted_category = manual_category
            source = "manual"
        else:
            # Fall back to ML engine
            predicted_category = ml_engine.predict_category(complaint_text)
            predicted_category = validate_prediction(predicted_category, complaint_text.lower())
            source = "model"

        # Final validation
        if predicted_category not in CATEGORIES:
            predicted_category = "Other"

        # Also get sentiment for preview
        sentiment_score = ml_engine.get_sentiment_score(complaint_text)

        return jsonify({
            "category": predicted_category,
            "confidence": 0.85,  # Mock confidence score
            "auto_corrected": bool(manual_category),
            "prediction_source": source,
            "sentiment_score": sentiment_score
        })

    except Exception as e:
        print(f"❌ Error in predict_category: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/check_duplicates", methods=["POST"])
def check_duplicates():
    """Check for existing similar complaints"""
    try:
        data = request.json
        if not data or "complaint" not in data:
            return jsonify({"error": "Missing complaint text"}), 400
            
        complaint_text = data.get("complaint", "").strip()
        
        # Get recent complaints for comparison (limit to 100 for performance)
        recent_complaints = list(complaints_collection.find({}, limit=100).sort("timestamp", -1))
        
        duplicates = ml_engine.check_duplicates(complaint_text, recent_complaints)
        
        return jsonify({
            "has_duplicates": len(duplicates) > 0,
            "duplicates": duplicates
        })
    except Exception as e:
        print(f"❌ Error in check_duplicates: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/submit_complaint", methods=["POST"])
@limiter.limit("5 per minute")
def submit_complaint():
    try:
        print("Received complaint submission request")
        
        # Security: Input Sanitization
        if request.is_json:
            data = request.json
            complaint_text = sanitize_content(data.get("complaint", ""))
            location = sanitize_content(data.get("location", ""))
            lat = data.get("lat")
            lng = data.get("lng")
            has_photo = data.get("hasPhoto", False)
            submitted_by = sanitize_content(data.get("submitted_by", "Anonymous"))
            tags = [sanitize_content(t) for t in data.get("tags", [])]
            anonymous = data.get("anonymous", False)
        else:
            complaint_text = sanitize_content(request.form.get("complaint", ""))
            location = sanitize_content(request.form.get("location", "Not specified"))
            lat = request.form.get("lat")
            lng = request.form.get("lng")
            has_photo = 'photo' in request.files
            submitted_by = sanitize_content(request.form.get("submitted_by", "Anonymous"))
            tags_str = request.form.get("tags", "")
            tags = [sanitize_content(t.strip()) for t in tags_str.split(",") if t.strip()] if tags_str else []
            anonymous = request.form.get("anonymous", "false").lower() == "true"

        if len(complaint_text) < 10:
            return jsonify({"success": False, "message": "Complaint too short"}), 400

        # AI: Category & Sentiment
        predicted_category = ml_engine.predict_category(complaint_text)
        sentiment_score = ml_engine.get_sentiment_score(complaint_text)
        
        # AI: Priority & Emergency
        boosted_priority, priority_reasons = ml_engine.calculate_priority_boost(complaint_text, 5)
        is_emergency = ml_engine.detect_emergency(complaint_text)
        if is_emergency:
            boosted_priority = 10.0 # Force max priority for emergencies
            
        # AI: Resolution Time Prediction
        pred_time = ml_engine.predict_resolution_time(predicted_category, sentiment_score)
        
        # AI: Duplicate Detection (Sim > 0.75)
        recent_complaints = list(complaints_collection.find({}, limit=50).sort("timestamp", -1))
        duplicates = ml_engine.check_duplicates(complaint_text, recent_complaints, threshold=0.75)
        is_duplicate = len(duplicates) > 0
        parent_id = duplicates[0]['id'] if is_duplicate else None
        
        # Security: File Upload Protection
        photo_filename = None
        if has_photo and 'photo' in request.files:
            photo = request.files['photo']
            if photo and allowed_file(photo.filename):
                complaint_id_temp = str(uuid.uuid4())
                ext = photo.filename.rsplit('.', 1)[1].lower()
                photo_filename = f"{complaint_id_temp}.{ext}"
                photo.save(os.path.join(app.config['UPLOAD_FOLDER'], photo_filename))
            elif photo:
                return jsonify({"error": "Invalid file type"}), 400

        # Auto-assign department based on category
        department_mapping = {
            "Water Issues": "Water Dept",
            "Road Issues": "Public Works",
            "Garbage Issues": "Sanitation",
            "Electricity": "Electrical",
            "Drainage Issues": "Public Works"
        }
        assigned_department = department_mapping.get(predicted_category, "Unassigned")

        complaint_id = str(uuid.uuid4())
        complaint_entry = {
            "_id": complaint_id,
            "complaint": complaint_text,
            "category": predicted_category,
            "location": location,
            "coords": {"lat": lat, "lng": lng} if lat and lng else None,
            "has_photo": bool(photo_filename),
            "photo_path": photo_filename,
            "timestamp": datetime.datetime.utcnow(),
            "status": "new",
            "priority_score": boosted_priority,
            "is_emergency": is_emergency,
            "sentiment_score": sentiment_score,
            "predicted_resolution_time": pred_time,
            "is_duplicate": is_duplicate,
            "parent_complaint_id": parent_id,
            "votes": 1 if is_duplicate else 0, # If duplicate, count as a vote/support
            "submitted_by": submitted_by,
            "anonymous": anonymous,
            "assigned_department": assigned_department
        }
        
        if is_duplicate:
            # Increase vote count for parent if duplicate
            complaints_collection.update_one({"_id": parent_id}, {"$inc": {"votes": 1}})
            
        # Check if this is a priority complaint and log it
        check_priority_complaint(complaint_entry)
            
        complaints_collection.insert_one(complaint_entry)
        log_security_event("complaint_submission", "success", f"Complaint {complaint_id} submitted")
        
        return jsonify({
            "success": True,
            "complaint_id": complaint_id,
            "is_emergency": is_emergency,
            "predicted_resolution": f"{pred_time} days",
            "priority_score": boosted_priority,
            "category": predicted_category
        })
    except Exception as e:
        print(f"❌ Error in submit_complaint: {e}")
        log_security_event("complaint_submission", "error", str(e))
        return jsonify({"error": "Submission failed"}), 500

@app.route("/update_status", methods=["POST"])
@admin_required
def update_status():
    """Update the status of a complaint and optionally add an admin note"""
    try:
        data = request.json
        complaint_id = None
        new_status = None
        admin_note = None
        
        if data is not None:
            complaint_id = data.get("complaintId")
            new_status = data.get("status")
            admin_note = data.get("adminNote")
        
        if not complaint_id or not new_status:
            return jsonify({"error": "Missing required fields"}), 400
            
        if new_status not in ["new", "in_progress", "resolved"]:
            return jsonify({"error": "Invalid status value"}), 400
            
        update_data = {"status": new_status}
        if new_status == "resolved":
            update_data["resolved_at"] = datetime.datetime.utcnow()
            
        update_doc = {"$set": update_data}
        if admin_note:
            update_data["admin_note"] = admin_note
            update_doc["$push"] = {
                "admin_notes": {
                    "admin": "System Administrator",
                    "text": admin_note,
                    "timestamp": datetime.datetime.utcnow()
                }
            }
            
        result = complaints_collection.update_one(
            {"_id": complaint_id},
            update_doc
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Complaint not found"}), 404
            
        # Log activity
        status_text = "New" if new_status == "new" else "In Progress" if new_status == "in_progress" else "Resolved"
        log_activity("status_update", f"Complaint #{complaint_id[:8]} marked as {status_text}")
            
        return jsonify({"success": True})
    except Exception as e:
        print(f"❌ Error in update_status: {e}")
        return jsonify({"error": "Internal server error"}), 500
        
@app.route("/assign_department", methods=["POST"])
@admin_required
def assign_department():
    """Assign a complaint to a department"""
    try:
        data = request.json
        complaint_id = None
        department = None
        
        if data is not None:
            complaint_id = data.get("complaintId")
            department = data.get("department")
        
        if not complaint_id or not department:
            return jsonify({"error": "Missing required fields"}), 400
            
        result = complaints_collection.update_one(
            {"_id": complaint_id},
            {"$set": {"assigned_department": department}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Complaint not found"}), 404
            
        return jsonify({"success": True})
    except Exception as e:
        print(f"❌ Error in assign_department: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/save_admin_note", methods=["POST"])
@admin_required
def save_admin_note():
    """Save an admin note for a complaint"""
    try:
        data = request.json
        complaint_id = None
        note_text = None
        
        if data is not None:
            complaint_id = data.get("complaintId")
            note_text = data.get("noteText")
        
        if not complaint_id or not note_text:
            return jsonify({"error": "Missing required fields"}), 400
            
        # Create admin note object
        admin_note = {
            "text": note_text,
            "timestamp": datetime.datetime.utcnow(),
            "admin": "Administrator"  # In a real app, this would be the logged-in admin
        }
        
        # Add note to the complaint
        result = complaints_collection.update_one(
            {"_id": complaint_id},
            {"$push": {"admin_notes": admin_note}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Complaint not found"}), 404
            
        return jsonify({"success": True, "message": "Admin note saved successfully"})
    except Exception as e:
        print(f"❌ Error in save_admin_note: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/upload_photo/<complaint_id>", methods=["POST"])
def upload_photo(complaint_id):
    """Handle photo upload for a specific complaint"""
    try:
        if 'photo' not in request.files:
            return jsonify({"error": "No photo part in the request"}), 400
            
        photo = request.files['photo']
        if photo.filename == '':
            return jsonify({"error": "No photo selected"}), 400
            
        # Check if complaint exists
        complaint = complaints_collection.find_one({"_id": complaint_id})
        if not complaint:
            return jsonify({"error": "Complaint not found"}), 404
            
        # Save the photo
        filename = f"{complaint_id}.jpg"
        photo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        photo.save(photo_path)
        
        # Update complaint record with photo path
        complaints_collection.update_one(
            {"_id": complaint_id},
            {"$set": {"has_photo": True, "photo_path": filename}}
        )
        
        return jsonify({
            "message": "Photo uploaded successfully",
            "photo_path": filename
        })
        
    except Exception as e:
        print(f"❌ Error in upload_photo: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/photos/<filename>", methods=["GET"])
def get_photo(filename):
    """Serve uploaded photos"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route("/get_categories", methods=["GET"])
def get_categories():
    try:
        return jsonify(CATEGORIES)
    except Exception as e:
        print(f"\u274c Error in get_categories: {e}")
        return jsonify({"error": str(e)}), 500
        
@app.route('/get_analytics', methods=['GET'])
def get_analytics():
    try:
        # Get total complaints count
        total_complaints = complaints_collection.count_documents({})
        
        # Get counts by category
        pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        category_results = list(complaints_collection.aggregate(pipeline))
        category_counts = {item['_id']: item['count'] for item in category_results}
        
        # Get counts by status
        resolved_count = complaints_collection.count_documents({"status": "resolved"})
        pending_count = complaints_collection.count_documents({"status": {"$ne": "resolved"}})
        
        return jsonify({
            'total_complaints': total_complaints,
            'category_counts': category_counts,
            'resolved_count': resolved_count,
            'pending_count': pending_count
        })
    except Exception as e:
        print(f"Error in get_analytics: {e}")
        return jsonify({'error': str(e)}), 500

@app.route("/admin_analytics", methods=["GET"])
@admin_required
def admin_analytics():
    """Advanced analytics for admin dashboard"""
    try:
        # 1. Total, Resolved, Pending counts
        total = complaints_collection.count_documents({})
        resolved = complaints_collection.count_documents({"status": "resolved"})
        pending = complaints_collection.count_documents({"status": {"$in": ["new", "in_progress"]}})
        
        # 2. Complaints by category
        category_pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        categories = list(complaints_collection.aggregate(category_pipeline))
        
        # 3. Average resolution time (days)
        res_time_pipeline = [
            {"$match": {"status": "resolved", "resolved_at": {"$exists": True}, "timestamp": {"$exists": True}}},
            {"$project": {
                "duration": {"$subtract": ["$resolved_at", "$timestamp"]}
            }},
            {"$group": {
                "_id": None,
                "avg_ms": {"$avg": "$duration"}
            }}
        ]
        res_time_result = list(complaints_collection.aggregate(res_time_pipeline))
        avg_res_time = 0
        if res_time_result:
            # Convert ms to days
            avg_res_time = round(res_time_result[0]["avg_ms"] / (1000 * 60 * 60 * 24), 2)
            
        # 4. Top 5 highest priority complaints
        top_priority = list(complaints_collection.find(
            {"status": {"$ne": "resolved"}},
            sort=[("priority_score", -1), ("timestamp", -1)],
            limit=5
        ))
        for p in top_priority:
            p["_id"] = str(p["_id"])
            if "timestamp" in p:
                p["timestamp"] = p["timestamp"].isoformat()
        
        # 6. Emergency count
        emergency_count = complaints_collection.count_documents({"is_emergency": True})
        
        # 5. Complaints over time (grouped by day)
        time_pipeline = [
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}},
            {"$limit": 30}
        ]
        over_time_raw = list(complaints_collection.aggregate(time_pipeline))
        over_time = [{"date": item["_id"], "count": item["count"]} for item in over_time_raw]
        
        # Format category distribution for Recharts
        category_formatted = [{"name": item["_id"], "value": item["count"]} for item in categories]
        
        return jsonify({
            "total_complaints": total,
            "resolved_count": resolved,
            "pending_count": pending,
            "emergency_count": emergency_count,
            "category_distribution": category_formatted,
            "average_resolution_time": avg_res_time,
            "top_priority_complaints": top_priority,
            "complaints_over_time": over_time
        })
    except Exception as e:
        print(f"❌ Error in admin_analytics: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/department_performance", methods=["GET"])
@admin_required
def department_performance():
    """Performance metrics for each department"""
    try:
        # Group by department
        pipeline = [
            {"$group": {
                "_id": "$assigned_department",
                "total": {"$sum": 1},
                "resolved": {"$sum": {"$cond": [{"$eq": ["$status", "resolved"]}, 1, 0]}},
                "pending": {"$sum": {"$cond": [{"$in": ["$status", ["new", "in_progress"]]}, 1, 0]}},
                "avg_res_time": {"$avg": {
                    "$cond": [
                        {"$and": [
                            {"$eq": ["$status", "resolved"]}, 
                            {"$ne": [{"$type": "$resolved_at"}, "missing"]},
                            {"$ne": [{"$type": "$timestamp"}, "missing"]}
                        ]},
                        {"$subtract": ["$resolved_at", "$timestamp"]},
                        None
                    ]
                }}
            }}
        ]
        results = list(complaints_collection.aggregate(pipeline))
        
        # Format results
        performance_data = []
        for res in results:
            dept_name = res["_id"] if res["_id"] else "Unassigned"
            # Convert avg_res_time from ms to days
            avg_days = round(res["avg_res_time"] / (1000 * 60 * 60 * 24), 2) if res["avg_res_time"] else 0
            
            performance_data.append({
                "department": dept_name,
                "total_assigned": res["total"],
                "resolved_count": res["resolved"],
                "pending_count": res["pending"],
                "average_resolution_time": avg_days
            })
            
        return jsonify(performance_data)
    except Exception as e:
        print(f"❌ Error in department_performance: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/get_complaints", methods=["GET"])
def get_complaints():
    """Get complaints with optional filtering and sorting"""
    try:
        # Get query parameters
        category = request.args.get("category")
        status = request.args.get("status")
        sort_by = request.args.get("sort", "newest")
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))
        search = request.args.get("search", "")
        submitted_by = request.args.get("submitted_by")
        
        # Build query
        query = {}
        if category and category != "All":
            query["category"] = category
        if status and status != "All":
            # Handle multiple statuses (comma-separated)
            if "," in status:
                statuses = status.split(",")
                query["status"] = {"$in": statuses}
            else:
                query["status"] = status
        if search:
            query["$text"] = {"$search": search}
        if submitted_by:
            query["submitted_by"] = submitted_by
            
        # Determine sort order
        if sort_by == "newest":
            sort_order = [("timestamp", -1)]
        elif sort_by == "oldest":
            sort_order = [("timestamp", 1)]
        elif sort_by == "highest_priority":
            sort_order = [("priority_score", -1), ("votes", -1), ("timestamp", -1)]
        elif sort_by == "most_votes":
            sort_order = [("votes", -1), ("timestamp", -1)]
        else:
            sort_order = [("timestamp", -1)]
            
        # Calculate pagination
        skip = (page - 1) * per_page
        
        # Create text index if it doesn't exist
        try:
            complaints_collection.create_index([("complaint_text", "text")])
        except Exception as e:
            print(f"Warning: Could not create text index: {e}")
        
        # Auto Escalation Logic: If status = 'new' and older than 3 days, increase priority and mark escalated
        three_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=3)
        escalation_result = complaints_collection.update_many(
            {
                "status": "new",
                "timestamp": {"$lt": three_days_ago},
                "escalated": {"$ne": True}
            },
            {
                "$inc": {"priority_score": 2},
                "$set": {"escalated": True}
            }
        )
        if escalation_result.modified_count > 0:
            print(f"🚀 Escalated {escalation_result.modified_count} complaints")
        
        # Execute query
        total_count = complaints_collection.count_documents(query)
        # Emergency Priority sorting: is_emergency DESC, then requested sort_by
        complaints = list(complaints_collection.find(
            query, 
            sort=[("is_emergency", -1)] + sort_order,
            skip=skip,
            limit=per_page
        ))
        
        # Convert ObjectId to string for JSON serialization
        for complaint in complaints:
            if "_id" in complaint:
                complaint["_id"] = str(complaint["_id"])
            if "timestamp" in complaint:
                complaint["timestamp"] = complaint["timestamp"].isoformat()
                
        return jsonify({
            "complaints": complaints,
            "total": total_count,
            "page": page,
            "per_page": per_page,
            "total_pages": (total_count + per_page - 1) // per_page
        })
    except Exception as e:
        print(f"❌ Error in get_complaints: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/vote_complaint', methods=['POST'])
def vote_complaint():
    try:
        data = request.json
        complaint_id = None
        vote_type = 'upvote'
        user_email = None
        
        if data is not None:
            complaint_id = data.get('complaintId')
            vote_type = data.get('voteType', 'upvote')
            user_email = data.get('userEmail')  # Get the user's email
        
        if not complaint_id:
            return jsonify({'error': 'Complaint ID is required'}), 400
            
        # Check if the user has already voted on this complaint
        complaint = complaints_collection.find_one({'_id': complaint_id})
        if not complaint:
            return jsonify({'error': 'Complaint not found'}), 404
            
        # Check if user has already voted
        if user_email:
            voters = complaint.get('voters', [])
            if user_email in voters:
                return jsonify({'error': 'You have already voted on this complaint'}), 400
        
        # Update vote count
        vote_change = 1 if vote_type == 'upvote' else -1
        
        # Prepare update operations
        update_ops = {
            '$inc': {'votes': vote_change, 'priority_score': vote_change * 0.5}
        }
        
        # Add user to voters list if email is provided
        if user_email:
            update_ops['$addToSet'] = {'voters': user_email}
        
        # Update the complaint with the new vote count and voter tracking
        result = complaints_collection.update_one(
            {'_id': complaint_id},
            update_ops
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Complaint not found or vote not recorded'}), 404
            
        # Get the updated complaint
        updated_complaint = complaints_collection.find_one({'_id': complaint_id})
        votes_count = 0
        priority_score = 5
        
        if updated_complaint is not None:
            votes_count = updated_complaint.get('votes', 0)
            priority_score = updated_complaint.get('priority_score', 5)
            
        return jsonify({
            'success': True,
            'message': f'Vote {"added" if vote_type == "upvote" else "removed"}',
            'votes': votes_count,
            'priority_score': priority_score
        })
    except Exception as e:
        print(f"❌ Error in vote_complaint: {e}")
        return jsonify({'error': str(e)}), 500
        
@app.route('/add_comment', methods=['POST'])
def add_comment():
    try:
        data = request.json
        complaint_id = None
        comment_text = None
        
        if data is not None:
            complaint_id = data.get('complaintId')
            comment_text = data.get('comment')
        
        if not complaint_id or not comment_text:
            return jsonify({'error': 'Complaint ID and comment text are required'}), 400
            
        # Create comment object
        comment = {
            'text': comment_text,
            'timestamp': datetime.datetime.utcnow(),
            'user': 'Anonymous User',  # In a real app, this would be the logged-in user
            'comment_id': str(uuid.uuid4())  # Generate a unique ID for the comment
        }
        
        # Add comment to the complaint
        result = complaints_collection.update_one(
            {'_id': complaint_id},
            {'$push': {'comments': comment}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Complaint not found or comment not added'}), 404
            
        return jsonify({
            'success': True,
            'message': 'Comment added successfully',
            'comment': comment
        })
    except Exception as e:
        print(f"❌ Error in add_comment: {e}")
        return jsonify({'error': str(e)}), 500

@app.route("/get_recent_activity", methods=["GET"])
def get_recent_activity():
    """Get recent activity logs"""
    try:
        # Get the 10 most recent activities
        activities = list(activity_collection.find().sort("timestamp", -1).limit(10))
        
        # Convert ObjectId to string and format timestamp
        for activity in activities:
            if "_id" in activity:
                activity["_id"] = str(activity["_id"])
            if "timestamp" in activity:
                # Calculate time ago
                time_ago = format_time_ago(activity["timestamp"])
                activity["time_ago"] = time_ago
                activity["timestamp"] = activity["timestamp"].isoformat()
                
        return jsonify(activities)
    except Exception as e:
        print(f"Error in get_recent_activity: {e}")
        return jsonify({"error": str(e)}), 500

def log_activity(activity_type, message):
    """Log an activity to the activity collection"""
    try:
        activity = {
            "type": activity_type,
            "message": message,
            "timestamp": datetime.datetime.utcnow()
        }
        activity_collection.insert_one(activity)
    except Exception as e:
        print(f"Error logging activity: {e}")

def format_time_ago(timestamp):
    """Format timestamp to human-readable time ago string"""
    try:
        # If timestamp is already a string, parse it
        if isinstance(timestamp, str):
            timestamp = datetime.datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        
        now = datetime.datetime.utcnow()
        # Make sure both timestamps are timezone-naive
        if timestamp.tzinfo is not None:
            timestamp = timestamp.replace(tzinfo=None)
        if now.tzinfo is not None:
            now = now.replace(tzinfo=None)
            
        diff = now - timestamp
        
        if diff.total_seconds() < 60:
            return "just now"
        elif diff.total_seconds() < 3600:
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        elif diff.total_seconds() < 86400:
            hours = int(diff.total_seconds() / 3600)
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        else:
            days = int(diff.total_seconds() / 86400)
            return f"{days} day{'s' if days > 1 else ''} ago"
    except Exception as e:
        print(f"Error in format_time_ago: {e}")
        return "recently"

def check_priority_complaint(complaint_entry):
    """Check if a complaint is high priority and log it"""
    # Define what makes a complaint "priority"
    # Priority score > 8 or contains urgent keywords
    is_priority = (
        complaint_entry.get("priority_score", 5) >= 8 or
        complaint_entry.get("is_emergency", False) or
        any(keyword in complaint_entry.get("complaint", "").lower() 
            for keyword in ["urgent", "emergency", "immediate", "critical", "asap"])
    )
    
    # Also consider complaints with high votes as priority
    if complaint_entry.get("votes", 0) >= 5:
        is_priority = True
    
    if is_priority:
        # Log priority complaint activity
        category = complaint_entry.get("category", "Unknown")
        priority_score = complaint_entry.get("priority_score", 5)
        votes = complaint_entry.get("votes", 0)
        
        # Create a more detailed message
        reason = []
        if priority_score >= 8:
            reason.append(f"High priority score ({priority_score})")
        if complaint_entry.get("is_emergency", False):
            reason.append("Emergency situation")
        if votes >= 5:
            reason.append(f"High votes ({votes})")
        if any(keyword in complaint_entry.get("complaint", "").lower() 
               for keyword in ["urgent", "emergency", "immediate", "critical", "asap"]):
            reason.append("Contains urgent keywords")
            
        reason_str = ", ".join(reason)
        
        # Get time ago string
        timestamp = complaint_entry.get("timestamp", datetime.datetime.utcnow())
        time_ago = format_time_ago(timestamp)
        
        log_activity(
            "priority_complaint", 
            f"🚨 HIGH PRIORITY: New complaint in {category} category (Reason: {reason_str}) - Reported {time_ago}"
        )
    
    return is_priority

@app.route("/complaint_locations", methods=["GET"])
def get_complaint_locations():
    """Returns locations for heatmap."""
    complaints = list(complaints_collection.find({"coords": {"$ne": None}, "status": {"$ne": "resolved"}}))
    locations = []
    for c in complaints:
        locations.append({
            "lat": c["coords"]["lat"],
            "lng": c["coords"]["lng"],
            "category": c["category"],
            "intensity": 1.0 + (c.get("priority_score", 5) / 10.0)
        })
    return jsonify(locations)

@app.route("/hotspot_analysis", methods=["GET"])
def hotspot_analysis():
    """Identifies high-density complaint areas."""
    # Simple aggregation by rounded coordinates (0.01 degree approx 1km)
    pipeline = [
        {"$match": {"coords": {"$ne": None}}},
        {"$group": {
            "_id": {
                "lat": {"$round": ["$coords.lat", 2]},
                "lng": {"$round": ["$coords.lng", 2]}
            },
            "count": {"$sum": 1},
            "avg_priority": {"$avg": "$priority_score"}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    hotspots = list(complaints_collection.aggregate(pipeline))
    return jsonify(hotspots)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)



