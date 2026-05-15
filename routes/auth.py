"""
routes/auth.py  —  Authentication
  POST  /api/login
  POST  /api/logout
  GET   /api/me
  POST  /api/change-password
"""

from flask import Blueprint, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash

from db import query
from utils.auth import User, parse_permissions

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/login", methods=["POST"])
def api_login():
    data     = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    role     = data.get("role", "admin")

    if not all([username, password]):
        return jsonify({"error": "All fields required"}), 400

    # ── ADMIN / SUB-ADMIN ──────────────────────────────────────────
    if role == "admin":
        cfg = query("SELECT * FROM admin_config LIMIT 1", one=True)
        if cfg and username == "admin" and check_password_hash(cfg["password_hash"], password):
            u = User("admin", "admin", "Principal")
            login_user(u, remember=True)
            session["user_info"] = {
                "id": "admin", "role": "admin", "name": "Principal",
                "is_sub_admin": False, "permissions": [], "allowed_classes": []
            }
            return jsonify({"success": True, "user": {
                "id": "admin", "role": "admin", "name": "Principal",
                "isSubAdmin": False, "permissions": [], "allowedClasses": []
            }})

        sa = query(
            "SELECT * FROM sub_admins WHERE username=%s AND portal='active'",
            (username,), one=True
        )
        if sa and check_password_hash(sa["password_hash"], password):
            perms           = parse_permissions(sa.get("permissions", []))
            allowed_classes = parse_permissions(sa.get("allowed_classes") or [])
            u = User(sa["id"], "admin", sa["name"],
                     is_sub_admin=True, permissions=perms,
                     allowed_classes=allowed_classes)
            login_user(u, remember=True)
            session["user_info"] = {
                "id":              sa["id"],
                "role":            "admin",
                "name":            sa["name"],
                "is_sub_admin":    True,
                "permissions":     perms,
                "allowed_classes": allowed_classes,
            }
            return jsonify({"success": True, "user": {
                "id":             sa["id"],
                "role":           "admin",
                "name":           sa["name"],
                "isSubAdmin":     True,
                "permissions":    perms,
                "allowedClasses": allowed_classes,
            }})

        return jsonify({"error": "Invalid credentials"}), 401

    # ── TEACHER ────────────────────────────────────────────────────
    if role == "teacher":
        t = query(
            "SELECT * FROM teachers WHERE id=%s AND portal='active'",
            (username,), one=True
        )
        if not t or not check_password_hash(t.get("password_hash", ""), password):
            return jsonify({"error": "Invalid ID or password. Try T001 / teach1"}), 401
        u = User(t["id"], "teacher", t["name"])
        login_user(u, remember=True)
        session["user_info"] = {
            "id": t["id"], "role": "teacher", "name": t["name"],
            "is_sub_admin": False, "permissions": [], "allowed_classes": []
        }
        return jsonify({"success": True, "user": {
            "id": t["id"], "role": "teacher", "name": t["name"],
            "isSubAdmin": False, "permissions": [], "allowedClasses": []
        }})

    # ── STUDENT ────────────────────────────────────────────────────
    if role == "student":
        s = query(
            "SELECT * FROM students WHERE id=%s AND portal='active'",
            (username,), one=True
        )
        if not s or not check_password_hash(s.get("password_hash", ""), password):
            return jsonify({"error": "Invalid ID or password. Try S001 / 1234"}), 401
        u = User(s["id"], "student", s["name"])
        login_user(u, remember=True)
        session["user_info"] = {
            "id": s["id"], "role": "student", "name": s["name"],
            "is_sub_admin": False, "permissions": [], "allowed_classes": []
        }
        return jsonify({"success": True, "user": {
            "id": s["id"], "role": "student", "name": s["name"],
            "isSubAdmin": False, "permissions": [], "allowedClasses": []
        }})

    return jsonify({"error": "Invalid role"}), 400


@auth_bp.route("/api/logout", methods=["POST"])
@login_required
def api_logout():
    logout_user()
    session.pop("user_info", None)
    return jsonify({"success": True})


@auth_bp.route("/api/me", methods=["GET"])
@login_required
def api_me():
    info = session.get("user_info", {})
    return jsonify({
        "id":             info.get("id"),
        "role":           info.get("role"),
        "name":           info.get("name"),
        "isSubAdmin":     info.get("is_sub_admin", False),
        "permissions":    info.get("permissions", []),
        "allowedClasses": info.get("allowed_classes", []),
    })


@auth_bp.route("/api/change-password", methods=["POST"])
@login_required
def api_change_password():
    data    = request.get_json() or {}
    cur_pwd = data.get("currentPassword", "").strip()
    new_pwd = data.get("newPassword", "").strip()

    if not cur_pwd or not new_pwd:
        return jsonify({"error": "All fields required"}), 400
    if len(new_pwd) < 4:
        return jsonify({"error": "Password must be at least 4 characters"}), 400

    role = current_user.role
    if role == "admin" and not current_user.is_sub_admin:
        cfg = query("SELECT * FROM admin_config LIMIT 1", one=True)
        if not cfg or not check_password_hash(cfg["password_hash"], cur_pwd):
            return jsonify({"error": "Current password incorrect"}), 400
        query("UPDATE admin_config SET password_hash=%s WHERE id=%s",
              (generate_password_hash(new_pwd), cfg["id"]), commit=True)
    elif role == "teacher":
        t = query("SELECT * FROM teachers WHERE id=%s", (current_user.id,), one=True)
        if not t or not check_password_hash(t.get("password_hash", ""), cur_pwd):
            return jsonify({"error": "Current password incorrect"}), 400
        query("UPDATE teachers SET password_hash=%s WHERE id=%s",
              (generate_password_hash(new_pwd), current_user.id), commit=True)
    elif role == "student":
        s = query("SELECT * FROM students WHERE id=%s", (current_user.id,), one=True)
        if not s or not check_password_hash(s.get("password_hash", ""), cur_pwd):
            return jsonify({"error": "Current password incorrect"}), 400
        query("UPDATE students SET password_hash=%s WHERE id=%s",
              (generate_password_hash(new_pwd), current_user.id), commit=True)
    else:
        return jsonify({"error": "Cannot change password for this role"}), 403

    return jsonify({"success": True, "message": "Password updated successfully!"})