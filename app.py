import os
import html

# Load local .env file if it exists (automatically ignored by git)
if os.path.exists('.env'):
    with open('.env') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, val = line.strip().split('=', 1)
                os.environ[key.strip()] = val.strip()

from flask import Flask, render_template, request, jsonify, send_file, session
from models import db, GuestbookEntry
import markdown
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///portfolio.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = os.environ.get('SECRET_KEY', 'dev-key-for-portfolio-auth')

# Default password hash for 'admin123' used for local development.
# In production, set the environment variable 'ADMIN_PASSWORD_HASH' with a secure hash.
DEFAULT_HASH = generate_password_hash('admin123')
app.config['ADMIN_PASSWORD_HASH'] = os.environ.get('ADMIN_PASSWORD_HASH', DEFAULT_HASH)

# Initialize DB with App
db.init_app(app)

# Ensure posts directory exists
POSTS_DIR = os.path.join(app.root_path, 'posts')
os.makedirs(POSTS_DIR, exist_ok=True)

# Create a default welcome post if none exists
WELCOME_POST_PATH = os.path.join(POSTS_DIR, 'welcome.md')
if not os.path.exists(WELCOME_POST_PATH):
    with open(WELCOME_POST_PATH, 'w', encoding='utf-8') as f:
        f.write("""# Welcome to my Interactive Portfolio!

Hello and welcome to my developer console and dashboard. 

Here is what makes this portfolio unique:
1. **Interactive Terminal Emulator:** Type commands on the left terminal pane to explore my bio, skills, and projects.
2. **Dynamic Dashboard:** View simulated real-time server health and diagnostics in the right pane.
3. **Database-backed Guestbook:** Sign the guestbook directly from the terminal or using the web form!

### Technical Details
* **Backend:** Python / Flask
* **ORM & DB:** SQLAlchemy / SQLite
* **Frontend:** Modern CSS Grid + Vanilla JS Command Parser

Type `help` in the terminal to explore all capabilities!
""")

# Create database tables
with app.app_context():
    db.create_all()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/system-stats", methods=["GET"])
def system_stats():
    # Return simulated real-time server stats that fluctuate slightly
    import random
    cpu_percent = round(random.uniform(5.0, 25.0), 1)
    memory_percent = round(random.uniform(35.0, 48.0), 1)
    db_latency_ms = round(random.uniform(1.2, 8.5), 2)
    
    # Simple uptime calculation (seconds since app start, tracked via app config)
    if 'start_time' not in app.config:
        from time import time
        app.config['start_time'] = time()
    
    from time import time
    uptime = int(time() - app.config['start_time'])
    
    return jsonify({
        "cpu": cpu_percent,
        "memory": memory_percent,
        "db_latency": db_latency_ms,
        "uptime": uptime
    })

@app.route("/api/guestbook", methods=["GET", "POST"])
def guestbook_api():
    if request.method == "POST":
        data = request.json or {}
        name = data.get("name", "").strip()
        message = data.get("message", "").strip()
        
        if not name or not message:
            return jsonify({"error": "Name and message are required."}), 400
            
        # Secure practice: HTML escape inputs to prevent XSS (Cross-Site Scripting)
        clean_name = html.escape(name)[:100]
        clean_message = html.escape(message)[:500]
        
        try:
            entry = GuestbookEntry(name=clean_name, message=clean_message)
            db.session.add(entry)
            db.session.commit()
            return jsonify(entry.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Failed to save entry."}), 500
            
    # GET method - return last 15 entries sorted by newest
    entries = GuestbookEntry.query.order_by(GuestbookEntry.created_at.desc()).limit(15).all()
    return jsonify([entry.to_dict() for entry in entries])

@app.route("/api/blog", methods=["GET"])
def list_blog_posts():
    try:
        files = os.listdir(POSTS_DIR)
        posts = []
        for file in files:
            if file.endswith('.md'):
                slug = file[:-3]
                title = slug.replace('-', ' ').title()
                posts.append({"slug": slug, "title": title})
        return jsonify(posts)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/blog/<slug>", methods=["GET"])
def view_blog_post(slug):
    post_path = os.path.join(POSTS_DIR, f"{slug}.md")
    if not os.path.exists(post_path):
        return jsonify({"error": "Blog post not found."}), 404
        
    try:
        with open(post_path, 'r', encoding='utf-8') as f:
            text = f.read()
            
        # Convert Markdown to HTML
        html_content = markdown.markdown(text, extensions=['fenced_code', 'codehilite'])
        
        # Simple extraction of first heading as title if available
        title = slug.replace('-', ' ').title()
        for line in text.splitlines():
            if line.startswith('# '):
                title = line[2:].strip()
                break
                
        return jsonify({
            "title": title,
            "content": html_content
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.json or {}
    password = data.get("password")
    if password and check_password_hash(app.config['ADMIN_PASSWORD_HASH'], password):
        session['is_admin'] = True
        return jsonify({"success": True, "message": "Admin login successful."})
    return jsonify({"success": False, "error": "Invalid password."}), 401

@app.route("/api/admin/logout", methods=["POST"])
def admin_logout():
    session.pop('is_admin', None)
    return jsonify({"success": True, "message": "Logged out."})

@app.route("/api/admin/status", methods=["GET"])
def admin_status():
    return jsonify({"is_admin": session.get('is_admin', False)})

@app.route("/api/admin/delete/<int:entry_id>", methods=["DELETE"])
def admin_delete(entry_id):
    if not session.get('is_admin'):
        return jsonify({"error": "Unauthorized. Please login as admin."}), 401
    
    try:
        entry = GuestbookEntry.query.get(entry_id)
        if not entry:
            return jsonify({"error": "Entry not found."}), 404
        
        db.session.delete(entry)
        db.session.commit()
        return jsonify({"success": True, "message": f"Entry {entry_id} deleted successfully."})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete entry: {str(e)}"}), 500

@app.route("/download-resume")
def download_resume():
    try:
        # Check if the PDF file exists at the root of the project
        pdf_path = os.path.join(app.root_path, "Swanand_Resume.pdf")
        if not os.path.exists(pdf_path):
            return "Resume file Swanand_Resume.pdf not found in the project root.", 404
        return send_file(pdf_path, as_attachment=True)
    except Exception as e:
        return f"Error downloading resume: {str(e)}", 500

if __name__ == "__main__":
    app.run(debug=True, port=8000)
