"""
app.py  —  NEXus Solution CMS — Entry Point
"""

from flask import Flask, render_template
from config import SECRET_KEY, SESSION_PERMANENT, PERMANENT_SESSION_LIFETIME
from utils.auth import login_manager

from routes.auth        import auth_bp
from routes.students    import students_bp
from routes.teachers    import teachers_bp
from routes.attendance  import attendance_bp
from routes.academics   import academics_bp
from routes.fees        import fees_bp
from routes.assignments import assignments_bp
from routes.admin       import admin_bp
from routes.classes     import classes_bp


def create_app():
    app = Flask(__name__)
    app.secret_key                           = SECRET_KEY
    app.config["SESSION_PERMANENT"]          = SESSION_PERMANENT
    app.config["PERMANENT_SESSION_LIFETIME"] = PERMANENT_SESSION_LIFETIME
    app.config["MAX_CONTENT_LENGTH"]         = 10 * 1024 * 1024   # 10 MB

    login_manager.init_app(app)

    for bp in [auth_bp, students_bp, teachers_bp, attendance_bp,
               academics_bp, fees_bp, assignments_bp, admin_bp, classes_bp]:
        app.register_blueprint(bp)

    # ── Auto-migration: ensure DB columns added after initial release exist ──
    _run_migrations()

    @app.route("/")
    def index():
        return render_template("index.html")

    return app


def _run_migrations():
    """Run safe ALTER TABLE migrations for columns added after initial release.
    Uses INFORMATION_SCHEMA check for MySQL 8.0 compatibility (IF NOT EXISTS not supported).
    """
    from db import query

    # Each entry: (table, column, ALTER statement to run if column is missing)
    migrations = [
        # sub_admins.allowed_classes — per-class sub-admin access control
        ("sub_admins", "allowed_classes",
         "ALTER TABLE sub_admins ADD COLUMN allowed_classes JSON DEFAULT NULL"),
        # exams.class_id / section_id — class/section exam scheduling
        ("exams", "class_id",
         "ALTER TABLE exams ADD COLUMN class_id INT DEFAULT NULL"),
        ("exams", "section_id",
         "ALTER TABLE exams ADD COLUMN section_id INT DEFAULT NULL"),
        # assignments extra columns
        ("assignments", "total_marks",
         "ALTER TABLE assignments ADD COLUMN total_marks INT DEFAULT 100"),
        ("assignments", "attach_name",
         "ALTER TABLE assignments ADD COLUMN attach_name VARCHAR(255) DEFAULT NULL"),
        ("assignments", "attach_data",
         "ALTER TABLE assignments ADD COLUMN attach_data LONGTEXT DEFAULT NULL"),
        ("assignments", "updated_at",
         "ALTER TABLE assignments ADD COLUMN updated_at DATETIME DEFAULT NULL"),
        # submissions extra columns
        ("submissions", "student_comment",
         "ALTER TABLE submissions ADD COLUMN student_comment TEXT DEFAULT NULL"),
        ("submissions", "is_late",
         "ALTER TABLE submissions ADD COLUMN is_late TINYINT(1) DEFAULT 0"),
        ("submissions", "total_marks",
         "ALTER TABLE submissions ADD COLUMN total_marks INT DEFAULT 100"),
        ("submissions", "checked_at",
         "ALTER TABLE submissions ADD COLUMN checked_at DATETIME DEFAULT NULL"),
    ]

    for table, column, sql in migrations:
        try:
            exists = query(
                """SELECT COUNT(*) AS cnt
                   FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME   = %s
                     AND COLUMN_NAME  = %s""",
                (table, column)
            )
            if exists and exists[0]["cnt"] == 0:
                query(sql, commit=True)
                print(f"[migration] Applied: {table}.{column}")
            # else: column exists, skip silently
        except Exception as e:
            print(f"[migration] Skipped {table}.{column}: {e}")


app = create_app()

if __name__ == "__main__":
    from utils.seed import seed_sample_passwords
    print("=" * 62)
    print("  NEXus Solution — College Management System")
    print("  Flask + MySQL  |  http://127.0.0.1:5000")
    print("=" * 62)
    try:
        seed_sample_passwords()
    except Exception as e:
        print(f"[warn] Seed skipped: {e}")
    app.run(debug=True, port=5000)
