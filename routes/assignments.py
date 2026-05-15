"""
routes/assignments.py  —  Assignment Management System
  Teachers:
    GET/POST  /api/assignments              — list (role-filtered) / create
    GET       /api/assignments/<aid>/submissions  — view who submitted
    POST      /api/submissions/<sub_id>/grade    — award marks + remarks + status

  Students:
    POST      /api/assignments/<aid>/submit — submit assignment (once, with comment)

  Shared:
    GET/POST  /api/timetable/<tid>          — timetable upload/view
    POST      /api/portal/student/<sid>     — toggle student portal (admin only)
    POST      /api/portal/teacher/<tid>     — toggle teacher portal (admin only)

  NOTE: Admin has NO assignment routes — removed by design.
"""

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from db import query
from config import SUBJECTS, TODAY
from utils.auth import admin_required, ts

assignments_bp = Blueprint("assignments", __name__)


# ================================================================
# SAFE MIGRATION SHIMS
# ================================================================
def _run_migrations():
    """Ensure new columns exist without breaking existing schema.
    Uses INFORMATION_SCHEMA check for MySQL 5.x compatibility
    (IF NOT EXISTS in ALTER TABLE is only supported in MySQL 8.0+).
    """
    migrations = [
        ("assignments", "total_marks",
         "ALTER TABLE assignments ADD COLUMN total_marks INT DEFAULT 100"),
        ("assignments", "attach_name",
         "ALTER TABLE assignments ADD COLUMN attach_name VARCHAR(255) DEFAULT NULL"),
        ("assignments", "attach_data",
         "ALTER TABLE assignments ADD COLUMN attach_data LONGTEXT DEFAULT NULL"),
        ("assignments", "updated_at",
         "ALTER TABLE assignments ADD COLUMN updated_at DATETIME DEFAULT NULL"),
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
        except Exception:
            pass
    # Extend status ENUM to include checked/rejected (idempotent)
    try:
        query(
            "ALTER TABLE submissions MODIFY COLUMN status "
            "ENUM('submitted','graded','checked','rejected') DEFAULT 'submitted'",
            commit=True,
        )
    except Exception:
        pass


_run_migrations()


# ================================================================
# ASSIGNMENTS — LIST (role-filtered)
# ================================================================
@assignments_bp.route("/api/assignments", methods=["GET"])
@login_required
def api_get_assignments():
    if current_user.role == "admin":
        return jsonify({"error": "Admin does not manage assignments"}), 403

    sql  = "SELECT * FROM assignments WHERE 1=1"
    args = []

    if current_user.role == "student":
        # Only show assignments for the student's class
        s = query("SELECT cls FROM students WHERE id=%s", (current_user.id,), one=True)
        if s and s["cls"]:
            sql  += " AND cls=%s"
            args.append(s["cls"])
        else:
            return jsonify([])

    elif current_user.role == "teacher":
        # Only the teacher's own assignments
        sql  += " AND teacher_id=%s"
        args.append(current_user.id)

    # Optional filters from query string
    cls = request.args.get("cls", "")
    sub = request.args.get("subject", "")
    if cls: sql += " AND cls=%s";     args.append(cls)
    if sub: sql += " AND subject=%s"; args.append(sub)

    sql += " ORDER BY created_date DESC, id DESC"
    rows = query(sql, args)

    return jsonify([{
        **r,
        "dueDate":     str(r.get("due_date",     "") or ""),
        "createdAt":   str(r.get("created_date", "") or ""),
        "classId":     r.get("class_id"),
        "teacherId":   r.get("teacher_id",   ""),
        "teacherName": r.get("teacher_name", ""),
        "totalMarks":  r.get("total_marks",  100),
        "attachName":  r.get("attach_name",  "") or "",
        "attachData":  r.get("attach_data",  "") or "",
    } for r in rows])


# ================================================================
# ASSIGNMENTS — CREATE (Teacher only)
# ================================================================
@assignments_bp.route("/api/assignments", methods=["POST"])
@login_required
def api_create_assignment():
    if current_user.role == "student":
        return jsonify({"error": "Students cannot create assignments"}), 403
    if current_user.role == "admin":
        return jsonify({"error": "Admin does not manage assignments"}), 403

    data  = request.get_json() or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title required"}), 400

    cls = (data.get("cls") or "").strip()
    if not cls:
        return jsonify({"error": "Class/Section is required"}), 400

    due_date = data.get("dueDate") or None
    if not due_date:
        return jsonify({"error": "Due date is required"}), 400

    # Validate total marks
    try:
        total_marks = int(data.get("totalMarks", 100))
        if total_marks < 1:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "Total marks must be a positive number"}), 400

    # Teacher's own subject from DB profile
    teacher_row  = query("SELECT name, subject FROM teachers WHERE id=%s",
                         (current_user.id,), one=True)
    subject      = teacher_row["subject"] if teacher_row else data.get("subject", "")
    teacher_name = teacher_row["name"]    if teacher_row else "Teacher"

    # Optional attachment (base64 stored in DB)
    attach_name = (data.get("attachName") or "").strip() or None
    attach_data = data.get("attachData") or None
    if attach_data == "":
        attach_data = None

    aid      = "A" + str(ts())
    class_id = data.get("class_id") or None
    try:
        class_id = int(class_id) if class_id else None
    except (TypeError, ValueError):
        class_id = None

    query(
        """INSERT INTO assignments
           (id, title, subject, cls, class_id, teacher_id, teacher_name,
            due_date, description, total_marks, attach_name, attach_data, created_date)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (aid, title, subject, cls, class_id,
         current_user.id, teacher_name,
         due_date,
         data.get("description", ""),
         total_marks,
         attach_name,
         attach_data,
         TODAY),
        commit=True,
    )
    return jsonify({"success": True, "assignment": {"id": aid, "title": title}}), 201


# ================================================================
# SUBMISSION — Student submits their assignment
# ================================================================
@assignments_bp.route("/api/assignments/<aid>/submit", methods=["POST"])
@login_required
def api_submit_assignment(aid):
    if current_user.role != "student":
        return jsonify({"error": "Only students can submit assignments"}), 403

    # Verify assignment exists and belongs to this student's class
    a = query("SELECT id, cls, due_date, total_marks FROM assignments WHERE id=%s",
              (aid,), one=True)
    if not a:
        return jsonify({"error": "Assignment not found"}), 404

    s = query("SELECT * FROM students WHERE id=%s", (current_user.id,), one=True)
    if not s:
        return jsonify({"error": "Student record not found"}), 404
    if s["cls"] != a["cls"]:
        return jsonify({"error": "This assignment is not for your class"}), 403

    # Prevent duplicate submission
    existing = query(
        "SELECT id FROM submissions WHERE assignment_id=%s AND student_id=%s",
        (aid, current_user.id), one=True,
    )
    if existing:
        return jsonify({
            "error": "You have already submitted this assignment. Contact your teacher to allow resubmission."
        }), 409

    data           = request.get_json() or {}
    file_name      = (data.get("fileName") or "").strip() or "file"
    file_data      = data.get("fileData") or ""
    student_comment= (data.get("studentComment") or "").strip() or None

    # Auto-detect late submission
    is_late = 0
    if a.get("due_date"):
        from datetime import date
        due = a["due_date"]
        if isinstance(due, str):
            from datetime import datetime
            due = datetime.strptime(due, "%Y-%m-%d").date()
        if date.today() > due:
            is_late = 1

    total_marks = a.get("total_marks") or 100
    sub_id      = "SUB" + str(ts())

    query(
        """INSERT INTO submissions
           (id, assignment_id, student_id, student_name, cls,
            file_name, file_data, student_comment,
            submitted_date, status, is_late, total_marks)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,'submitted',%s,%s)""",
        (sub_id, aid, current_user.id,
         s["name"], s["cls"],
         file_name, file_data, student_comment,
         TODAY, is_late, total_marks),
        commit=True,
    )
    return jsonify({"success": True, "late": bool(is_late)}), 201


# ================================================================
# SUBMISSIONS — Get for a specific assignment (Teacher only)
# ================================================================
@assignments_bp.route("/api/assignments/<aid>/submissions", methods=["GET"])
@login_required
def api_get_submissions(aid):
    if current_user.role == "teacher":
        owner = query(
            "SELECT id FROM assignments WHERE id=%s AND teacher_id=%s",
            (aid, current_user.id), one=True,
        )
        if not owner:
            return jsonify({"error": "Access denied or assignment not found"}), 403

    rows = query(
        "SELECT * FROM submissions WHERE assignment_id=%s ORDER BY submitted_date DESC",
        (aid,),
    )
    return jsonify([{
        **r,
        "submittedAt":    str(r.get("submitted_date", "") or ""),
        "studentComment": r.get("student_comment", "") or "",
        "isLate":         bool(r.get("is_late", 0)),
        "totalMarks":     r.get("total_marks") or 100,
        "checkedAt":      str(r.get("checked_at", "") or ""),
    } for r in rows])


# ================================================================
# SUBMISSIONS — Full list (role-filtered)
# ================================================================
@assignments_bp.route("/api/submissions-list", methods=["GET"])
@login_required
def api_get_all_submissions():
    if current_user.role == "admin":
        return jsonify({"error": "Admin does not manage assignments"}), 403

    if current_user.role == "student":
        rows = query(
            "SELECT * FROM submissions WHERE student_id=%s ORDER BY submitted_date DESC",
            (current_user.id,),
        )
    elif current_user.role == "teacher":
        teacher_assignment_ids = query(
            "SELECT id FROM assignments WHERE teacher_id=%s", (current_user.id,)
        )
        if not teacher_assignment_ids:
            return jsonify([])
        ids = [a["id"] for a in teacher_assignment_ids]
        ph  = ",".join(["%s"] * len(ids))
        rows = query(
            f"SELECT * FROM submissions WHERE assignment_id IN ({ph}) ORDER BY submitted_date DESC",
            ids,
        )
    else:
        rows = query("SELECT * FROM submissions ORDER BY submitted_date DESC")

    return jsonify([{
        **r,
        "assignmentId":   r.get("assignment_id",  ""),
        "studentId":      r.get("student_id",     ""),
        "studentName":    r.get("student_name",   ""),
        "fileName":       r.get("file_name",      ""),
        "submittedAt":    str(r.get("submitted_date", "") or ""),
        "grade":          r.get("grade"),
        "feedback":       r.get("feedback", "")    or "",
        "status":         r.get("status",   "submitted"),
        "studentComment": r.get("student_comment", "") or "",
        "isLate":         bool(r.get("is_late", 0)),
        "totalMarks":     r.get("total_marks") or 100,
        "checkedAt":      str(r.get("checked_at", "") or ""),
    } for r in rows])


# ================================================================
# GRADING — Teacher awards marks, remarks, and status
# ================================================================
@assignments_bp.route("/api/submissions/<sub_id>/grade", methods=["POST"])
@login_required
def api_grade_submission(sub_id):
    if current_user.role == "student":
        return jsonify({"error": "Students cannot grade submissions"}), 403
    if current_user.role == "admin":
        return jsonify({"error": "Admin does not manage assignments"}), 403

    sub = query("SELECT * FROM submissions WHERE id=%s", (sub_id,), one=True)
    if not sub:
        return jsonify({"error": "Submission not found"}), 404

    # Verify teacher owns this assignment
    if current_user.role == "teacher":
        assignment = query(
            "SELECT id, total_marks FROM assignments WHERE id=%s AND teacher_id=%s",
            (sub["assignment_id"], current_user.id), one=True,
        )
        if not assignment:
            return jsonify({"error": "Access denied: this is not your assignment"}), 403
    else:
        assignment = query(
            "SELECT id, total_marks FROM assignments WHERE id=%s",
            (sub["assignment_id"],), one=True,
        )

    data        = request.get_json() or {}
    feedback    = (data.get("feedback") or "").strip()
    new_status  = (data.get("status") or "checked")
    total_marks = (assignment or {}).get("total_marks") or sub.get("total_marks") or 100

    # Validate status
    if new_status not in {"submitted", "checked", "rejected"}:
        new_status = "checked"

    # Validate marks
    grade_raw = data.get("grade")
    if grade_raw is None or grade_raw == "":
        return jsonify({"error": "Marks are required"}), 400
    try:
        grade = float(grade_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Marks must be a number"}), 400
    if not (0 <= grade <= total_marks):
        return jsonify({"error": f"Marks must be between 0 and {total_marks}"}), 400

    query(
        """UPDATE submissions
           SET grade=%s, feedback=%s, status=%s,
               total_marks=%s, checked_at=NOW()
           WHERE id=%s""",
        (grade, feedback, new_status, total_marks, sub_id),
        commit=True,
    )
    return jsonify({
        "success":    True,
        "grade":      grade,
        "feedback":   feedback,
        "status":     new_status,
        "totalMarks": total_marks,
    })


# ================================================================
# ASSIGNMENT EDIT / UPDATE (Teacher only — owns assignment)
# ================================================================
@assignments_bp.route("/api/assignments/<aid>", methods=["PUT"])
@login_required
def api_update_assignment(aid):
    """
    PUT /api/assignments/<aid>
    Teacher can update only their own assignments.
    All fields are optional — only provided fields are updated.
    Attachment: if new file provided it replaces old one;
                if not provided old file is preserved.
    """
    if current_user.role == "student":
        return jsonify({"error": "Students cannot edit assignments"}), 403
    if current_user.role == "admin":
        return jsonify({"error": "Admin does not manage assignments"}), 403

    # Fetch and verify ownership
    a = query("SELECT * FROM assignments WHERE id=%s", (aid,), one=True)
    if not a:
        return jsonify({"error": "Assignment not found"}), 404
    if current_user.role == "teacher" and a["teacher_id"] != current_user.id:
        return jsonify({"error": "Access denied: you did not create this assignment"}), 403

    data = request.get_json() or {}

    # Build SET clause dynamically — only update provided fields
    sets, args = [], []

    title = (data.get("title") or "").strip()
    if title:
        sets.append("title=%s"); args.append(title)

    cls = (data.get("cls") or "").strip()
    if cls:
        sets.append("cls=%s"); args.append(cls)

    due_date = data.get("dueDate") or None
    if due_date:
        sets.append("due_date=%s"); args.append(due_date)

    description = data.get("description")
    if description is not None:
        sets.append("description=%s"); args.append(description.strip())

    # Total marks validation
    if "totalMarks" in data:
        try:
            total_marks = int(data["totalMarks"])
            if total_marks < 1:
                raise ValueError
            sets.append("total_marks=%s"); args.append(total_marks)
        except (TypeError, ValueError):
            return jsonify({"error": "Total marks must be a positive number"}), 400

    # Attachment — only replace if new file provided
    attach_name = (data.get("attachName") or "").strip()
    attach_data = data.get("attachData") or ""
    if attach_data:
        sets.append("attach_name=%s"); args.append(attach_name or None)
        sets.append("attach_data=%s"); args.append(attach_data)
    elif data.get("removeAttach"):
        # Explicit removal requested
        sets.append("attach_name=%s"); args.append(None)
        sets.append("attach_data=%s"); args.append(None)

    # Always update updated_at
    sets.append("updated_at=NOW()")

    if not sets:
        return jsonify({"error": "No fields to update"}), 400

    args.append(aid)
    query(
        f"UPDATE assignments SET {', '.join(sets)} WHERE id=%s",
        args,
        commit=True,
    )

    # Return updated assignment
    updated = query("SELECT * FROM assignments WHERE id=%s", (aid,), one=True)
    return jsonify({
        "success": True,
        "assignment": {
            **updated,
            "dueDate":    str(updated.get("due_date",     "") or ""),
            "createdAt":  str(updated.get("created_date", "") or ""),
            "updatedAt":  str(updated.get("updated_at",   "") or ""),
            "teacherId":  updated.get("teacher_id",  ""),
            "teacherName":updated.get("teacher_name",""),
            "totalMarks": updated.get("total_marks", 100),
            "attachName": updated.get("attach_name", "") or "",
            "attachData": updated.get("attach_data", "") or "",
        }
    }), 200


# ================================================================
# ASSIGNMENT DELETE (Teacher only — owns assignment)
# ================================================================
@assignments_bp.route("/api/assignments/<aid>", methods=["DELETE"])
@login_required
def api_delete_assignment(aid):
    """
    DELETE /api/assignments/<aid>
    - Only the teacher who created the assignment can delete it.
    - Admin and students are blocked.
    - Deletes all related submissions first (cascade safety).
    - Returns 200 on success, 403/404 on error.
    """
    # Role guard
    if current_user.role == "student":
        return jsonify({"error": "Students cannot delete assignments"}), 403
    if current_user.role == "admin":
        return jsonify({"error": "Admin does not manage assignments"}), 403

    # Fetch assignment and verify ownership
    a = query("SELECT id, teacher_id, title FROM assignments WHERE id=%s", (aid,), one=True)
    if not a:
        return jsonify({"error": "Assignment not found"}), 404

    if current_user.role == "teacher" and a["teacher_id"] != current_user.id:
        return jsonify({"error": "Access denied: you did not create this assignment"}), 403

    # Delete related submissions first (prevent orphan records)
    query("DELETE FROM submissions WHERE assignment_id=%s", (aid,), commit=True)

    # Delete the assignment itself
    query("DELETE FROM assignments WHERE id=%s", (aid,), commit=True)

    return jsonify({
        "success": True,
        "message": f"Assignment deleted successfully along with all its submissions."
    }), 200


# ================================================================
# TIMETABLE
# ================================================================
@assignments_bp.route("/api/timetable/<tid>", methods=["GET"])
@login_required
def api_get_timetable(tid):
    # Teachers can only fetch their own timetable
    if current_user.role == "teacher" and current_user.id != tid:
        return jsonify({"error": "Forbidden"}), 403

    tt = query("SELECT teacher_id, name, data, uploaded_date FROM timetables WHERE teacher_id=%s",
               (tid,), one=True)
    if not tt:
        return jsonify({"error": "No timetable uploaded"}), 404

    return jsonify({
        "teacherId":  tt["teacher_id"],
        "name":       tt["name"] or "",
        "data":       tt["data"] or "",
        "uploadedAt": str(tt["uploaded_date"] or ""),
    })


@assignments_bp.route("/api/timetables", methods=["GET"])
@login_required
def api_get_all_timetables():
    """Return all timetables — used by frontend on load to populate timetables{}."""
    # Teachers only get their own; admin/sub-admin get all
    if current_user.role == "teacher":
        rows = query(
            "SELECT teacher_id, name, uploaded_date FROM timetables WHERE teacher_id=%s",
            (current_user.id,)
        )
    elif current_user.role == "student":
        return jsonify([])   # students don't need timetable data directly
    else:
        rows = query("SELECT teacher_id, name, uploaded_date FROM timetables")

    # NOTE: we intentionally omit `data` (base64 blob) from bulk list — fetch individually
    return jsonify([{
        "teacherId":  r["teacher_id"],
        "name":       r["name"] or "",
        "uploadedAt": str(r["uploaded_date"] or ""),
        "hasData":    True,
    } for r in rows])


@assignments_bp.route("/api/timetable/<tid>", methods=["POST"])
@login_required
def api_upload_timetable(tid):
    # Only admin or the teacher themselves can upload
    if current_user.role == "teacher" and current_user.id != tid:
        return jsonify({"error": "Cannot upload for another teacher"}), 403
    if current_user.role == "student":
        return jsonify({"error": "Forbidden"}), 403

    # Verify teacher exists
    teacher = query("SELECT id FROM teachers WHERE id=%s", (tid,), one=True)
    if not teacher:
        return jsonify({"error": f"Teacher {tid} not found"}), 404

    data      = request.get_json() or {}
    name      = (data.get("name") or "timetable").strip()
    file_data = data.get("data", "").strip()

    if not file_data:
        return jsonify({"error": "No file data received"}), 400

    # Upsert — insert or update existing record (teacher_id is PRIMARY KEY)
    query(
        """INSERT INTO timetables (teacher_id, name, data, uploaded_date)
           VALUES (%s, %s, %s, CURDATE())
           ON DUPLICATE KEY UPDATE
             name          = VALUES(name),
             data          = VALUES(data),
             uploaded_date = CURDATE()""",
        (tid, name, file_data),
        commit=True
    )
    return jsonify({"success": True, "teacherId": tid, "name": name})


# ================================================================
# PORTAL ACCESS (Admin only)
# ================================================================
@assignments_bp.route("/api/portal/student/<sid>", methods=["POST"])
@admin_required
def api_toggle_student_portal(sid):
    s = query("SELECT portal FROM students WHERE id=%s", (sid,), one=True)
    if not s:
        return jsonify({"error": "Student not found"}), 404
    new_p = "inactive" if s["portal"] == "active" else "active"
    query("UPDATE students SET portal=%s WHERE id=%s", (new_p, sid), commit=True)
    return jsonify({"success": True, "portal": new_p})


@assignments_bp.route("/api/portal/teacher/<tid>", methods=["POST"])
@admin_required
def api_toggle_teacher_portal(tid):
    t = query("SELECT portal FROM teachers WHERE id=%s", (tid,), one=True)
    if not t:
        return jsonify({"error": "Teacher not found"}), 404
    new_p = "inactive" if t["portal"] == "active" else "active"
    query("UPDATE teachers SET portal=%s WHERE id=%s", (new_p, tid), commit=True)
    return jsonify({"success": True, "portal": new_p})