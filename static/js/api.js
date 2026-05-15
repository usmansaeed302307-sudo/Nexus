/* ================================================================
   js/api.js  —  NEXus Solution CMS
   ================================================================ */
async function loadAllDataFromDB() {
  try {
    const [stuRes, tchRes, examRes, noticeRes, compRes, assignRes, clsRes, secRes] = await Promise.all([
      fetch('/api/students'),
      fetch('/api/teachers'),
      fetch('/api/exams'),
      fetch('/api/notices'),
      fetch('/api/complaints'),
      fetch('/api/assignments'),
      fetch('/api/classes/dropdown'),
      fetch('/api/sections/dropdown'),
    ]);

    // ── Students ──
    if (stuRes.ok) students = (await stuRes.json()).map(s=>({...s,feeStatus:s.fee_status||s.feeStatus||"pending",subjectGroup:s.subject_group||s.subjectGroup||"Computer Science",rollNo:s.roll_no||s.rollNo||"",guardianPhone:s.guardian_phone||s.guardianPhone||"",portal:s.portal||"active",photo:s.photo||null}));

    // ── Classes & Sections dropdowns ──
    if (clsRes.ok) {
      dbClasses = await clsRes.json();
      window.dbClasses = dbClasses;
      if (!dbClasses.length) {
        // Fallback: unique cls strings from students
        dbClasses = [...new Set(students.map(s=>s.cls).filter(Boolean))].sort()
          .map(c=>({id:c, name:c, code:c}));
        window.dbClasses = dbClasses;
      }
    }
    if (secRes.ok) {
      dbSections = await secRes.json();
      window.dbSections = dbSections;
    }

    // ── attFilter defaults ──
    if (dbClasses.length && !attFilter.class_id) {
      attFilter.class_id = dbClasses[0].id;
      attFilter.cls      = dbClasses[0].code || dbClasses[0].name;
    }
    if (tchRes.ok)    teachers    = (await tchRes.json()).map(t=>({...t,joinDate:t.join_date||t.joinDate||"",portal:t.portal||"active",photo:t.photo||null}));
    if (examRes.ok)   exams       = (await examRes.json()).map(e=>({...e,date:e.exam_date||e.date||''}));
    if (noticeRes.ok) notices     = (await noticeRes.json()).map(n=>({...n,date:n.created_date||n.date||''}));
    if (compRes.ok)   complaints  = (await compRes.json()).map(c=>({...c,date:c.created_date||c.date||''}));
    if (assignRes.ok) assignments = (await assignRes.json()).map(a=>({...a,dueDate:a.due_date||a.dueDate||'',createdAt:a.created_date||a.createdAt||'',teacherId:a.teacher_id||a.teacherId||'',teacherName:a.teacher_name||a.teacherName||''}));

    // ── Submissions load karo (teacher + student dono ke liye) ──
    try {
      const subRes = await fetch('/api/submissions-list');
      if (subRes.ok) {
        const subData = await subRes.json();
        submissions = subData.map(s=>({
          ...s,
          assignmentId: s.assignment_id || s.assignmentId || '',
          studentId:    s.student_id    || s.studentId    || '',
          studentName:  s.student_name  || s.studentName  || '',
          fileName:     s.file_name     || s.fileName     || '',
          submittedAt:  s.submitted_date|| s.submittedAt  || '',
          grade:        s.grade         != null ? s.grade : null,
          feedback:     s.feedback      || '',
          status:       s.status        || 'submitted',
        }));
      }
    } catch(e) { console.error('Submissions load error:', e); }

    // Grades load karo
    const gRes = await fetch('/api/grades');
    if (gRes.ok) grades = await gRes.json();

    // Attendance load karo — teacher ke liye subject-based + full week, admin ke liye class-based
    let aUrl = `/api/attendance?date=${attFilter.date}`;
    if (currentUser && currentUser.role === 'teacher') {
      // Teacher: load full week attendance for all their students (for graph + today marking)
      const weekFetches = weekDays.map(d => fetch(`/api/teacher/${currentUser.id}/students?date=${d}`));
      const weekResults = await Promise.allSettled(weekFetches);
      weekResults.forEach((result, idx) => {
        const d = weekDays[idx];
        if (result.status === 'fulfilled' && result.value.ok) {
          result.value.json().then(subjStudents => {
            subjStudents.forEach(s => {
              if (!students.find(x => x.id === s.id)) {
                students.push({...s, feeStatus:s.fee_status||s.feeStatus||'pending',
                  subjectGroup:s.subject_group||s.subjectGroup||'Computer Science',
                  rollNo:s.roll_no||s.rollNo||'', guardianPhone:s.guardian_phone||s.guardianPhone||'',
                  portal:s.portal||'active', photo:s.photo||null});
              }
              if (!attendance[s.id]) attendance[s.id] = {};
              attendance[s.id][d] = s.attendanceStatus || 'absent';
            });
          }).catch(()=>{});
        }
      });
      // Also load today specifically (synchronously for immediate use)
      const teacherSubjRes = await fetch(`/api/teacher/${currentUser.id}/students?date=${attFilter.date}`);
      if (teacherSubjRes.ok) {
        const subjStudents = await teacherSubjRes.json();
        subjStudents.forEach(s => {
          if (!students.find(x => x.id === s.id)) {
            students.push({...s, feeStatus:s.fee_status||s.feeStatus||'pending',
              subjectGroup:s.subject_group||s.subjectGroup||'Computer Science',
              rollNo:s.roll_no||s.rollNo||'', guardianPhone:s.guardian_phone||s.guardianPhone||'',
              portal:s.portal||'active', photo:s.photo||null});
          }
          if (!attendance[s.id]) attendance[s.id] = {};
          attendance[s.id][attFilter.date] = s.attendanceStatus || 'absent';
        });
      }
    } else if (currentUser && currentUser.role === 'student') {
      // Student: load own full attendance history for chart + calendar
      try {
        const sAttRes = await fetch(`/api/attendance/student/${currentUser.id}`);
        if (sAttRes.ok) {
          const sAttData = await sAttRes.json();
          if (!attendance[currentUser.id]) attendance[currentUser.id] = {};
          Object.assign(attendance[currentUser.id], sAttData);
        }
      } catch(e) { console.error('Student att load error:', e); }
    } else {
      // Admin: load all attendance for selected class + full week for charts
      const weekAdminFetches = weekDays.map(d => fetch(`/api/attendance?date=${d}`));
      const weekAdminResults = await Promise.allSettled(weekAdminFetches);
      weekAdminResults.forEach((result, idx) => {
        const d = weekDays[idx];
        if (result.status === 'fulfilled' && result.value.ok) {
          result.value.json().then(attRows => {
            attRows.forEach(r => {
              if (!attendance[r.id]) attendance[r.id] = {};
              attendance[r.id][d] = r.status;
            });
          }).catch(()=>{});
        }
      });
      const aRes = await fetch(`/api/attendance?cls=${attFilter.cls}&date=${attFilter.date}`);
      if (aRes.ok) {
        const attRows = await aRes.json();
        attRows.forEach(r => {
          if (!attendance[r.id]) attendance[r.id] = {};
          attendance[r.id][attFilter.date] = r.status;
        });
      }
    }

    // Sub-admins load karo
    if (currentUser && currentUser.role === 'admin' && !currentUser.isSubAdmin) {
      const saRes = await fetch('/api/subadmins');
      if (saRes.ok) {
        const saRaw = await saRes.json();
        subAdmins = saRaw.map(sa => ({
          ...sa,
          allowedClasses: (typeof sa.allowed_classes === 'string' ? JSON.parse(sa.allowed_classes || '[]') : (sa.allowed_classes || []))
        }));
      }
    }

    // Fee data load karo
    const fRes = await fetch('/api/fees');
    if (fRes.ok) {
      const feeData = await fRes.json();
      feeData.forEach(item => {
        const s = item.student;
        if (s) {
          feeVouchers[s.id] = (item.vouchers || []).map(v => ({
            ...v, dueDate: v.due_date || v.dueDate, paidDate: v.paid_date || v.paidDate
          }));
          if (item.installments) {
            feeInstallments[s.id] = {
              totalFee: item.installments.total_fee,
              session: item.installments.session,
              installments: (item.installments.installments || []).map(i => ({
                no: i.inst_no, amount: i.amount,
                dueDate: i.due_date || i.dueDate,
                status: i.status,
                voucherNo: i.voucher_no || i.voucherNo,
                paidDate: i.paid_date || i.paidDate,
                receiptNo: i.receipt_no || i.receiptNo,
              }))
            };
          }
        }
      });
    }
    // ── Timetables — load from DB so they persist after refresh ──
    try {
      const ttListRes = await fetch('/api/timetables');
      if (ttListRes.ok) {
        const ttList = await ttListRes.json();
        // For each timetable entry, fetch its data blob
        const ttFetches = ttList.map(tt =>
          fetch(`/api/timetable/${tt.teacherId}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        );
        const ttResults = await Promise.all(ttFetches);
        ttResults.forEach(tt => {
          if (tt && tt.teacherId && tt.data) {
            timetables[tt.teacherId] = {
              name:       tt.name       || 'timetable',
              data:       tt.data       || '',
              uploadedAt: tt.uploadedAt || '',
            };
          }
        });
      }
    } catch(e) { console.error('Timetable load error:', e); }

  } catch(e) {
    console.error('DB load error:', e);
  }
  refreshContent();
}

// ── LOGIN — DB se ──
async function doLogin() {
  const uid = (document.getElementById('l-uid')?.value || '').trim();
  const pwd = (document.getElementById('l-pwd')?.value || '').trim();
  loginErr = '';
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({role: loginRole, username: uid, password: pwd})
    });
    const data = await res.json();
    if (data.success) {
      currentUser = {
        id: data.user.id,
        role: data.user.role,
        name: data.user.name,
        isSubAdmin: data.user.isSubAdmin || false,
        permissions: data.user.permissions || [],
        allowedClasses: data.user.allowedClasses || []
      };
      currentPage = 'dashboard';
      render();
      await loadAllDataFromDB();
    } else {
      loginErr = data.error || 'Invalid credentials.';
      render();
    }
  } catch(e) {
    loginErr = 'Server error. Make sure Flask is running.';
    render();
  }
}

// ── LOGOUT ──
async function doLogout() {
  try { await fetch('/api/logout', {method:'POST'}); } catch(e) {}
  currentUser = null; loginErr = ''; loginRole = 'admin'; render();
}

// ── ADD STUDENT ──
async function submitAddStudent() {
  const name = (document.getElementById('f-name')?.value || '').trim();
  if (!name) { alert('Please enter student name'); return; }
  const classId = document.getElementById('f-classId')?.value || '';
  if (!classId) { alert('Please select a class'); return; }
  // Resolve class name for the cls field (legacy text field kept for compatibility)
  const classEl = document.getElementById('f-classId');
  const clsName = classEl?.options[classEl.selectedIndex]?.text || classId;
  const sectionId = document.getElementById('f-sectionId')?.value || null;
  const pwd = (document.getElementById('f-password')?.value || '1234').trim();
  const body = {
    name, password: pwd,
    cls: clsName,
    classId: parseInt(classId) || null,
    sectionId: sectionId ? (parseInt(sectionId) || null) : null,
    subjectGroup: document.getElementById('f-subjectGroup')?.value || 'Computer Science',
    phone: document.getElementById('f-phone')?.value || '',
    guardianPhone: document.getElementById('f-guardianPhone')?.value || '',
    email: document.getElementById('f-email')?.value || '',
    feeStatus: document.getElementById('f-feeStatus')?.value || 'pending',
    dob: document.getElementById('f-dob')?.value || '',
    photo: formData._photoData || null,
  };
  try {
    const res = await fetch('/api/students', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    const data = await res.json();
    if (data.success) {
      alert(`✅ Student Added!

ID: ${data.id}
Password: ${data.plainPassword}`);
      closeModal();
      await loadAllDataFromDB();
    } else { alert('Error: ' + (data.error || 'Unknown error')); }
  } catch(e) { alert('Server error: ' + e.message); }
}

// ── EDIT STUDENT ──
async function submitEditStudent(sid) {
  const g = (id) => document.getElementById(id)?.value || formData[id.replace('f-','')] || '';
  const name = g('f-name').trim(); if (!name) { alert('Name cannot be empty'); return; }
  const classIdVal = document.getElementById('f-classId')?.value || '';
  const classEl2 = document.getElementById('f-classId');
  const clsName2 = classEl2?.options[classEl2?.selectedIndex]?.text || '';
  const sectionIdVal = document.getElementById('f-sectionId')?.value || '';
  const body = {
    name,
    cls: clsName2 || g('f-cls'),
    classId: classIdVal ? (parseInt(classIdVal) || null) : undefined,
    sectionId: sectionIdVal ? (parseInt(sectionIdVal) || null) : undefined,
    subjectGroup: g('f-subjectGroup'),
    phone: g('f-phone'), guardianPhone: g('f-guardianPhone'),
    email: g('f-email'), dob: g('f-dob'), feeStatus: g('f-feeStatus'),
  };
  const pwd = g('f-password').trim(); if (pwd) body.password = pwd;
  if (formData._photoData) body.photo = formData._photoData;
  try {
    const res = await fetch(`/api/students/${sid}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    const data = await res.json();
    if (data.success) {
      if (currentUser && currentUser.id === sid) currentUser.name = name;
      alert('✅ Student updated!'); closeModal();
      await loadAllDataFromDB();
    } else { alert('Error: ' + (data.error || 'Unknown')); }
  } catch(e) { alert('Server error: ' + e.message); }
}

// ── DELETE STUDENT ──
async function delStudent(sid) {
  if (!confirm('Delete this student?')) return;
  try {
    await fetch(`/api/students/${sid}`, {method:'DELETE'});
    students = students.filter(s => s.id !== sid);
    refreshContent();
  } catch(e) { alert('Error deleting: ' + e.message); }
}
function confirmDelStudent(sid) { delStudent(sid); if(modalState==='viewStudent'||modalState==='editStudent') closeModal(); }

// ── ADD TEACHER ──
async function submitAddTeacher() {
  const name = (document.getElementById('f-name')?.value || '').trim();
  if (!name) { alert('Please enter teacher name'); return; }
  const classId   = document.getElementById('f-teachClassId')?.value   || null;
  const sectionId = document.getElementById('f-teachSectionId')?.value || null;
  const body = {
    name,
    subject: document.getElementById('f-subject')?.value || '',
    dept: document.getElementById('f-dept')?.value || '',
    qualification: document.getElementById('f-qualification')?.value || '',
    phone: document.getElementById('f-phone')?.value || '',
    email: document.getElementById('f-email')?.value || '',
    photo: formData._photoData || null,
    class_id:   classId   ? parseInt(classId)   : null,
    section_id: sectionId ? parseInt(sectionId) : null,
  };
  try {
    const res = await fetch('/api/teachers', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    const data = await res.json();
    if (data.success) {
      alert(`✅ Teacher Added!
ID: ${data.id}
Password: ${data.plainPassword}`);
      closeModal(); await loadAllDataFromDB();
    } else { alert('Error: ' + (data.error || 'Unknown')); }
  } catch(e) { alert('Server error: ' + e.message); }
}

// ── EDIT TEACHER ──
async function submitEditTeacher(tid) {
  const g = (id) => document.getElementById(id)?.value || formData[id.replace('f-','')] || '';
  const name = g('f-name').trim(); if (!name) { alert('Name cannot be empty'); return; }
  const classId   = document.getElementById('f-teachClassId')?.value   || null;
  const sectionId = document.getElementById('f-teachSectionId')?.value || null;
  const body = {
    name, subject: g('f-subject'), dept: g('f-dept'),
    qualification: g('f-qualification'), phone: g('f-phone'), email: g('f-email'),
    class_id:   classId   ? parseInt(classId)   : null,
    section_id: sectionId ? parseInt(sectionId) : null,
  };
  const pwd = g('f-password').trim(); if (pwd) body.password = pwd;
  if (formData._photoData) body.photo = formData._photoData;
  try {
    const res = await fetch(`/api/teachers/${tid}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    const data = await res.json();
    if (data.success) {
      if (currentUser && currentUser.id === tid) currentUser.name = name;
      alert('✅ Teacher updated!'); closeModal(); await loadAllDataFromDB();
    } else { alert('Error: ' + (data.error || 'Unknown')); }
  } catch(e) { alert('Server error: ' + e.message); }
}

// ── DELETE TEACHER ──
async function delTeacher(tid) {
  if (!confirm('Remove this teacher?')) return;
  try {
    await fetch(`/api/teachers/${tid}`, {method:'DELETE'});
    teachers = teachers.filter(t => t.id !== tid); refreshContent();
  } catch(e) { alert('Error: ' + e.message); }
}

// ── MARK ATTENDANCE ──
async function markAtt(sid, status) {
  if (!attendance[sid]) attendance[sid] = {};
  attendance[sid][attFilter.date] = status;
  refreshContent();
  try {
    await fetch('/api/attendance', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({studentId: sid, date: attFilter.date, status})});
  } catch(e) { console.error('Att error:', e); }
}

// ── BULK ATTENDANCE (Admin — by class) ──
async function bulkAtt(status) {
  // Filter students matching current class + section selection
  const cls_students = students.filter(s => {
    const classMatch = attFilter.class_id
      ? (s.class_id === attFilter.class_id || s.classId === attFilter.class_id)
      : s.cls === attFilter.cls;
    const sectionMatch = attFilter.section_id
      ? (s.section_id === attFilter.section_id || s.sectionId === attFilter.section_id)
      : true;
    return classMatch && sectionMatch;
  });

  // Optimistic UI update
  cls_students.forEach(s => { if(!attendance[s.id])attendance[s.id]={}; attendance[s.id][attFilter.date]=status; });
  refreshContent();

  // Build payload — prefer class_id/section_id (DB-precise), fallback to cls string
  const payload = { date: attFilter.date, status };
  if (attFilter.class_id) {
    payload.class_id = attFilter.class_id;
    if (attFilter.section_id) payload.section_id = attFilter.section_id;
  } else {
    payload.cls = attFilter.cls;
  }

  try {
    await fetch('/api/attendance', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)});
  } catch(e) { console.error('Bulk att error:', e); }
}

// ── BULK ATTENDANCE (Teacher — by subject scope) ──
async function bulkSubjectAtt(status, ids) {
  // Use passed ids, fallback to globally stored visible ids
  const targetIds = (ids && ids.length) ? ids : (window._tAttVisibleIds || []);
  if (!targetIds.length) { console.warn('bulkSubjectAtt: no student ids found'); return; }

  // Optimistic UI update
  targetIds.forEach(sid => { if(!attendance[sid])attendance[sid]={}; attendance[sid][attFilter.date]=status; });
  refreshContent();

  try {
    // Post each student individually — reliable, scope-checked by backend
    await Promise.all(targetIds.map(sid =>
      fetch('/api/attendance', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({studentId: sid, date: attFilter.date, status})
      })
    ));
  } catch(e) {
    console.error('Subject bulk att error:', e);
  }
}

let _gradeTimer=null;
async function updateGrade(sid, sub, field, val) {
  if (!grades[sid]) grades[sid] = {};
  if (!grades[sid][sub]) grades[sid][sub] = {midterm:0, final:0, internal:0, total:0};
  grades[sid][sub][field] = Number(val);
  const g = grades[sid][sub];
  g.total = (g.midterm||0) + (g.final||0) + (g.internal||0);
  // Update only the total display cell without full re-render
  const totalEl = document.getElementById(`grade-total-${sid}-${sub.replace(/\s/g,'_')}`);
  if(totalEl) totalEl.innerHTML = `${g.total||0} · ${gradeLabel(g.total)}`;
  // Debounced backend save
  clearTimeout(_gradeTimer);
  _gradeTimer = setTimeout(async()=>{
    try {
      await fetch('/api/grades', {method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({studentId:sid, subject:sub, midterm:g.midterm, final:g.final, internal:g.internal})});
    } catch(e) { console.error('Grade error:', e); }
  }, 800);
}

// ── ADD EXAM ──
async function submitAddExam() {
  const title = (document.getElementById('f-title')?.value || '').trim();
  if (!title) { alert('Please enter exam title'); return; }
  const body = {
    title, subject: document.getElementById('f-subject')?.value || '',
    cls: document.getElementById('f-cls')?.value || 'CS-A',
    date: document.getElementById('f-date')?.value || '',
    time: document.getElementById('f-time')?.value || '',
    duration: document.getElementById('f-duration')?.value || '',
    room: document.getElementById('f-room')?.value || '',
    totalMarks: document.getElementById('f-totalMarks')?.value || '100',
  };
  try {
    const res = await fetch('/api/exams', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    const data = await res.json();
    if (data.success) { closeModal(); await loadAllDataFromDB(); }
    else { alert('Error: ' + (data.error || 'Unknown')); }
  } catch(e) { alert('Server error: ' + e.message); }
}

// ── DELETE EXAM ──
async function delExam(eid) {
  try {
    await fetch(`/api/exams/${eid}`, {method:'DELETE'});
    exams = exams.filter(e => e.id !== eid); refreshContent();
  } catch(e) { alert('Error: ' + e.message); }
}

// ── ADD NOTICE ──
async function submitAddNotice() {
  const title = (document.getElementById('f-title')?.value || '').trim();
  if (!title) { alert('Please enter notice title'); return; }
  const body = {
    title, type: document.getElementById('f-type')?.value || 'academic',
    author: document.getElementById('f-author')?.value || 'Admin',
  };
  try {
    const res = await fetch('/api/notices', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    const data = await res.json();
    if (data.success) { closeModal(); await loadAllDataFromDB(); }
    else { alert('Error: ' + (data.error || 'Unknown')); }
  } catch(e) { alert('Server error: ' + e.message); }
}

// ── DELETE NOTICE ──
async function delNotice(nid) {
  try {
    await fetch(`/api/notices/${nid}`, {method:'DELETE'});
    notices = notices.filter(n => n.id !== nid); refreshContent();
  } catch(e) { alert('Error: ' + e.message); }
}

// ── ADD COMPLAINT ──
async function submitComplaint() {
  const sid = document.getElementById('f-studentId')?.value || formData.studentId || '';
  const msg = (document.getElementById('f-message')?.value || '').trim();
  if (!sid || !msg) { alert('Please select a student and write a message'); return; }
  try {
    const res = await fetch('/api/complaints', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({studentId: sid, message: msg})});
    const data = await res.json();
    if (data.success) { closeModal(); await loadAllDataFromDB(); }
    else { alert('Error: ' + (data.error || 'Unknown')); }
  } catch(e) { alert('Server error: ' + e.message); }
}

// ── FEE STATUS ──
async function setFeeStatus(sid, status) {
  const s = students.find(x => x.id === sid); if (s) s.feeStatus = status;
  refreshContent();
  try {
    await fetch(`/api/fees/${sid}/status`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status})});
    await loadAllDataFromDB();
  } catch(e) { console.error('Fee error:', e); }
}
async function markPaid(sid) { setFeeStatus(sid, 'paid'); }
async function revertFee(sid) { if (!confirm('Revert to Pending?')) return; setFeeStatus(sid, 'pending'); }

// ── FEE PLAN ──
async function submitCreateFeePlan(sid) {
  const tf = Number(document.getElementById('f-totalFee')?.value || 0);
  const sess = (document.getElementById('f-session')?.value || '2025-26').trim();
  const d1 = document.getElementById('f-due1')?.value || '';
  const d2 = document.getElementById('f-due2')?.value || '';
  const d3 = document.getElementById('f-due3')?.value || '';
  if (!tf || tf < 1) { alert('Please enter a valid total fee.'); return; }
  if (!d1 || !d2 || !d3) { alert('Please fill all three due dates.'); return; }
  try {
    const res = await fetch(`/api/fees/${sid}/plan`, {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({totalFee: tf, session: sess, due1: d1, due2: d2, due3: d3})});
    const data = await res.json();
    if (data.success) { alert('Fee plan created! 3 installment vouchers ready.'); closeModal(); await loadAllDataFromDB(); }
    else { alert('Error: ' + (data.error || 'Unknown')); }
  } catch(e) { alert('Server error: ' + e.message); }
}

// ── MARK INSTALLMENT PAID ──
async function markInstallmentPaid(sid, no) {
  try {
    await fetch(`/api/fees/${sid}/installment/${no}/pay`, {method:'POST'});
    await loadAllDataFromDB();
    setTimeout(() => printInstallmentReceipt(sid, no), 300);
  } catch(e) { alert('Error: ' + e.message); }
}

async function revertInstallmentPaid(sid,no){
  if(!confirm('Revert installment to pending?'))return;
  try{await fetch(`/api/fees/${sid}/installment/${no}/revert`,{method:'POST'});await loadAllDataFromDB();}catch(e){alert('Error: '+e.message);}
}

// ── PORTAL TOGGLE ──
async function togglePortal(type, id) {
  try {
    const url = type === 'student' ? `/api/portal/student/${id}` : `/api/portal/teacher/${id}`;
    const res = await fetch(url, {method:'POST'});
    const data = await res.json();
    if (data.success) {
      if (type === 'student') { const s = students.find(x=>x.id===id); if(s) s.portal = data.portal; }
      else { const t = teachers.find(x=>x.id===id); if(t) t.portal = data.portal; }
      refreshContent();
    }
  } catch(e) { alert('Error: ' + e.message); }
}

// ── SUB-ADMINS ──
async function submitAddSubAdmin() {
  const name = (document.getElementById('f-name')?.value || '').trim();
  const username = (document.getElementById('f-username')?.value || '').trim();
  const password = (document.getElementById('f-password')?.value || '').trim();
  if (!name) { alert('Please enter a name'); return; }
  if (!username) { alert('Please enter a username'); return; }
  if (!password) { alert('Please enter a password'); return; }
  if (username === 'admin') { alert("Username 'admin' is reserved"); return; }
  try {
    const res = await fetch('/api/subadmins', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name, username, password, permissions: subAdminPermsSelected})});
    const data = await res.json();
    if (data.success) {
      alert(`✅ Sub-Admin Created!

Username: ${username}
Password: ${password}`);
      closeModal(); await loadAllDataFromDB();
    } else { alert('Error: ' + (data.error || 'Unknown')); }
  } catch(e) { alert('Server error: ' + e.message); }
}

async function submitEditSubAdmin(id) {
  const name = (document.getElementById('f-name')?.value || '').trim();
  const username = (document.getElementById('f-username')?.value || '').trim();
  const pwd = (document.getElementById('f-password')?.value || '').trim();
  if (!name) { alert('Name cannot be empty'); return; }
  if (!username) { alert('Username cannot be empty'); return; }
  const body = {name, username, permissions: subAdminPermsSelected};
  if (pwd) body.password = pwd;
  try {
    const res = await fetch(`/api/subadmins/${id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    const data = await res.json();
    if (data.success) {
      if (currentUser && currentUser.id === id) { currentUser.name = name; currentUser.permissions = [...subAdminPermsSelected]; }
      alert('✅ Sub-admin updated!'); closeModal(); await loadAllDataFromDB();
    } else { alert('Error: ' + (data.error || 'Unknown')); }
  } catch(e) { alert('Server error: ' + e.message); }
}

async function toggleSubAdmin(id) {
  try {
    const res = await fetch(`/api/subadmins/${id}/toggle`, {method:'POST'});
    const data = await res.json();
    if (data.success) { const sa = subAdmins.find(x=>x.id===id); if(sa) sa.portal = data.portal; refreshContent(); }
  } catch(e) { alert('Error: ' + e.message); }
}

async function delSubAdmin(id) {
  if (!confirm('Delete this sub-admin?')) return;
  try {
    await fetch(`/api/subadmins/${id}`, {method:'DELETE'});
    subAdmins = subAdmins.filter(x => x.id !== id); refreshContent();
  } catch(e) { alert('Error: ' + e.message); }
}

// ── CHANGE PASSWORD ──
async function submitChangePassword() {
  const cur = document.getElementById('cp-cur')?.value || '';
  const n = document.getElementById('cp-new')?.value || '';
  const c = document.getElementById('cp-conf')?.value || '';
  const msg = document.getElementById('cp-msg');
  if (!cur||!n||!c) { msg.innerHTML=`<span style="color:${T.red}">Please fill all fields.</span>`; return; }
  if (n.length < 4) { msg.innerHTML=`<span style="color:${T.red}">Min 4 characters.</span>`; return; }
  if (n !== c) { msg.innerHTML=`<span style="color:${T.red}">Passwords do not match.</span>`; return; }
  try {
    const res = await fetch('/api/change-password', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({currentPassword: cur, newPassword: n})});
    const data = await res.json();
    if (data.success) {
      msg.innerHTML=`<span style="color:${T.green};font-weight:700">✅ Password updated successfully!</span>`;
      setTimeout(()=>closeModal(), 1800);
    } else { msg.innerHTML=`<span style="color:${T.red}">${data.error}</span>`; }
  } catch(e) { msg.innerHTML=`<span style="color:${T.red}">Server error.</span>`; }
}

// ── CREATE ASSIGNMENT ──
async function submitCreateAssignment() {
  const title = (document.getElementById('f-title')?.value || '').trim();
  if (!title) { alert('Please enter assignment title'); return; }

  const dueDate = document.getElementById('f-dueDate')?.value || '';
  if (!dueDate) { alert('Please set a due date'); return; }

  // cls — get from select dropdown first, then formData fallback
  const clsEl  = document.getElementById('f-cls');
  const cls    = (clsEl ? clsEl.value : '') || formData.cls || '';
  if (!cls) { alert('Please select a class'); return; }

  const subject = document.getElementById('f-subject')?.value || formData.subject || '';
  const desc    = document.getElementById('f-description')?.value || formData.description || '';

  const body = { title, dueDate, subject, cls, description: desc };

  try {
    const res  = await fetch('/api/assignments', {
      method:  'POST',
      headers: {'Content-Type': 'application/json'},
      body:    JSON.stringify(body)
    });

    // Guard against HTML response (session expired etc)
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      alert('Server error: session may have expired. Please refresh the page.');
      return;
    }

    const data = await res.json();
    if (data.success) {
      closeModal();
      await loadAllDataFromDB();
    } else {
      alert('Error: ' + (data.error || 'Unknown error'));
    }
  } catch(e) {
    alert('Server error: ' + e.message);
  }
}

// ── ASSIGNMENT SUBMIT (STUDENT) ──
async function submitAssignment(assignmentId, studentId, studentName, cls, input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({fileName: file.name, fileData: ev.target.result})});
      const data = await res.json();
      if (data.success) { alert('✅ Assignment submitted!'); await loadAllDataFromDB(); }
      else { alert('Error: ' + (data.error || 'Unknown')); }
    } catch(e) { alert('Server error: ' + e.message); }
  };
  reader.readAsDataURL(file);
}

// ── TIMETABLE ──
async function uploadTT(tid, input) {
  const file = input.files[0];
  if (!file) return;

  // Size guard: base64 inflates ~33%, keep under 15MB raw
  if (file.size > 15 * 1024 * 1024) {
    alert('File too large. Maximum size is 15MB.');
    return;
  }

  const r = new FileReader();
  r.onload = async ev => {
    try {
      const res = await fetch(`/api/timetable/${tid}`, {
        method:  'POST',
        headers: {'Content-Type': 'application/json'},
        body:    JSON.stringify({ name: file.name, data: ev.target.result })
      });

      // Guard against HTML response (session expired)
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        alert('Upload failed: session may have expired. Please refresh and try again.');
        return;
      }

      const data = await res.json();
      if (data.success) {
        // Update local timetables state immediately
        timetables[tid] = {
          name:       file.name,
          data:       ev.target.result,
          uploadedAt: today,
        };
        refreshContent();
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch(e) {
      console.error('TT upload error:', e);
      alert('Upload failed: ' + e.message);
    }
  };
  r.onerror = () => alert('Could not read file. Please try again.');
  r.readAsDataURL(file);
}

// ── ON PAGE LOAD: check if already logged in ──
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/me');
    if (res.ok) {
      const data = await res.json();
      currentUser = {id: data.id, role: data.role, name: data.name, isSubAdmin: data.isSubAdmin, permissions: data.permissions || [], allowedClasses: data.allowedClasses || []};
      currentPage = 'dashboard';
      render();
      await loadAllDataFromDB();
    } else {
      render();
    }
  } catch(e) {
    render();
  }
});


/* ================================================================
   DYNAMIC CLASS / SECTION DROPDOWNS — Student Module Integration
   ================================================================ */

// Cache to avoid redundant fetches
let _cachedClasses = null;
let _cachedSectionsByClass = {};

/** Fetch active classes from Academics module and populate a <select> element. */
async function loadClassesDropdown(selectId, selectedClassId) {
  try {
    if (!_cachedClasses) {
      const res = await fetch('/api/classes/dropdown');
      _cachedClasses = await res.json();
    }
    const el = document.getElementById(selectId);
    if (!el) return;
    el.innerHTML = '<option value="">-- Select Class --</option>' +
      _cachedClasses.map(c =>
        `<option value="${c.id}" ${String(c.id) === String(selectedClassId) ? 'selected' : ''}>${esc ? esc(c.name) : c.name} (${c.code})</option>`
      ).join('');
    // If a class was pre-selected, load its sections too
    if (selectedClassId) {
      await loadSectionsDropdown('f-sectionId', selectedClassId, null);
    }
  } catch (e) {
    console.error('Failed to load classes dropdown:', e);
  }
}

/** Fetch sections for a given classId and populate the sections <select>. */
async function loadSectionsDropdown(selectId, classId, selectedSectionId) {
  try {
    if (!_cachedSectionsByClass[classId]) {
      const res = await fetch(`/api/sections/dropdown?class_id=${classId}`);
      _cachedSectionsByClass[classId] = await res.json();
    }
    const sections = _cachedSectionsByClass[classId] || [];
    const el = document.getElementById(selectId);
    if (!el) return;
    el.innerHTML = '<option value="">-- No Section --</option>' +
      sections.map(s =>
        `<option value="${s.id}" ${String(s.id) === String(selectedSectionId) ? 'selected' : ''}>${esc ? esc(s.name) : s.name}</option>`
      ).join('');
  } catch (e) {
    console.error('Failed to load sections dropdown:', e);
  }
}

/** Called when user changes the Class dropdown — refreshes Section dropdown. */
async function onStudentClassChange(classId, sectionSelectId) {
  const el = document.getElementById(sectionSelectId);
  if (!classId) {
    if (el) el.innerHTML = '<option value="">-- Select a class first --</option>';
    return;
  }
  if (el) el.innerHTML = '<option value="">Loading sections…</option>';
  await loadSectionsDropdown(sectionSelectId, classId, null);
}

/** Called after Add Student / Edit Student modal renders — populates dropdowns. */
function initStudentClassDropdown(selectedClassId, selectedSectionId) {
  // Use setTimeout so the DOM has rendered
  setTimeout(async () => {
    await loadClassesDropdown('f-classId', selectedClassId);
    if (selectedClassId) {
      await loadSectionsDropdown('f-sectionId', selectedClassId, selectedSectionId);
    }
  }, 0);
}

// ── TEACHER FORM — Class / Section dropdown helpers ──────────────────────────

/**
 * Populate Class + Section dropdowns in the Teacher Add/Edit modal.
 * Uses the SAME API endpoints as the Student form (/api/classes/dropdown,
 * /api/sections/dropdown?class_id=…) so no new backend route is needed.
 */
async function initTeacherClassDropdown(classSelectId, sectionSelectId, selectedClassId, selectedSectionId) {
  try {
    // Populate class dropdown (reuse shared cache)
    if (!_cachedClasses) {
      const res = await fetch('/api/classes/dropdown');
      _cachedClasses = await res.json();
    }
    const classEl = document.getElementById(classSelectId);
    if (classEl) {
      classEl.innerHTML =
        '<option value="">-- Select Class --</option>' +
        _cachedClasses.map(c =>
          `<option value="${c.id}" ${String(c.id) === String(selectedClassId) ? 'selected' : ''}>${esc ? esc(c.name) : c.name} (${c.code})</option>`
        ).join('');
    }
    // If a class was pre-selected, immediately populate sections
    if (selectedClassId) {
      await loadTeacherSectionsDropdown(sectionSelectId, selectedClassId, selectedSectionId);
    }
  } catch(e) {
    console.error('Teacher class dropdown error:', e);
  }
}

/** Fetch sections for the Teacher modal's section <select>. */
async function loadTeacherSectionsDropdown(sectionSelectId, classId, selectedSectionId) {
  try {
    if (!_cachedSectionsByClass[classId]) {
      const res = await fetch(`/api/sections/dropdown?class_id=${classId}`);
      _cachedSectionsByClass[classId] = await res.json();
    }
    const sections = _cachedSectionsByClass[classId] || [];
    const el = document.getElementById(sectionSelectId);
    if (!el) return;
    if (!sections.length) {
      el.innerHTML = '<option value="">-- No Sections for this Class --</option>';
      return;
    }
    el.innerHTML =
      '<option value="">-- No Section --</option>' +
      sections.map(s =>
        `<option value="${s.id}" ${String(s.id) === String(selectedSectionId) ? 'selected' : ''}>${esc ? esc(s.name) : s.name}</option>`
      ).join('');
  } catch(e) {
    console.error('Teacher section dropdown error:', e);
  }
}

/** Called when the Class dropdown in the Teacher form changes. */
async function onTeacherClassChange(classId, sectionSelectId) {
  const el = document.getElementById(sectionSelectId);
  if (!classId) {
    if (el) el.innerHTML = '<option value="">-- Select Class First --</option>';
    return;
  }
  if (el) el.innerHTML = '<option value="">Loading sections…</option>';
  await loadTeacherSectionsDropdown(sectionSelectId, classId, null);
}


// ================================================================
// EXAM CLASS/SECTION PICKER  (multi-select chip UI)
// ================================================================

let _examSelectedClasses  = [];   // array of class IDs
let _examSelectedSections = [];   // array of section IDs

async function initExamClassPicker() {
  _examSelectedClasses  = [];
  _examSelectedSections = [];
  try {
    if (!_cachedClasses) {
      const res = await fetch('/api/classes/dropdown');
      _cachedClasses = await res.json();
    }
    const el = document.getElementById('exam-class-list');
    if (!el) return;
    if (!_cachedClasses.length) {
      el.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:16px 8px;background:#fff7ed;border:1.5px dashed #fb923c;border-radius:10px;color:#ea580c;font-size:12px;font-weight:700">⚠️ No classes available.<br><span style="font-weight:400;color:#9a3412">Please add a class first before scheduling an exam.</span></div>`;
      return;
    }
    el.innerHTML = '';
    _cachedClasses.forEach(cls => {
      const chip = document.createElement('label');
      chip.style.cssText = `display:flex;align-items:center;gap:8px;padding:9px 11px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;cursor:pointer;transition:all .15s;font-size:12px;font-weight:700`;
      chip.innerHTML = `<div id="ecls-chk-${cls.id}" style="width:16px;height:16px;border-radius:4px;border:2px solid #cbd5e1;background:#fff;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:900"></div><span>${cls.name} (${cls.code})</span>`;
      chip.onclick = () => _toggleExamClass(cls.id, chip);
      el.appendChild(chip);
    });
  } catch(e) {
    console.error('initExamClassPicker error:', e);
  }
}

async function _toggleExamClass(classId, chip) {
  const idx = _examSelectedClasses.indexOf(classId);
  const chk = document.getElementById(`ecls-chk-${classId}`);
  if (idx >= 0) {
    _examSelectedClasses.splice(idx, 1);
    chip.style.background = '#f8fafc';
    chip.style.borderColor = '#e2e8f0';
    if (chk) { chk.textContent=''; chk.style.background='#fff'; chk.style.borderColor='#cbd5e1'; }
  } else {
    _examSelectedClasses.push(classId);
    chip.style.background = '#ecfdf5';
    chip.style.borderColor = '#6ee7b7';
    if (chk) { chk.textContent='✓'; chk.style.background='#059669'; chk.style.borderColor='#059669'; }
  }
  // Refresh section list based on selected classes
  await _loadExamSections();
}

async function _loadExamSections() {
  const secEl = document.getElementById('exam-section-list');
  if (!secEl) return;
  if (!_examSelectedClasses.length) {
    secEl.innerHTML = '<div style="color:#94a3b8;font-size:12px;padding:8px">Select a class first…</div>';
    _examSelectedSections = [];
    return;
  }
  secEl.innerHTML = '<div style="color:#94a3b8;font-size:12px;padding:8px">Loading sections…</div>';
  try {
    let allSections = [];
    for (const cid of _examSelectedClasses) {
      if (!_cachedSectionsByClass[cid]) {
        const r = await fetch(`/api/sections/dropdown?class_id=${cid}`);
        _cachedSectionsByClass[cid] = await r.json();
      }
      allSections = allSections.concat(_cachedSectionsByClass[cid] || []);
    }
    if (!allSections.length) {
      secEl.innerHTML = '<div style="color:#94a3b8;font-size:12px;padding:8px">No sections found</div>';
      return;
    }
    secEl.innerHTML = '';
    _examSelectedSections = _examSelectedSections.filter(sid => allSections.some(s => s.id === sid));
    allSections.forEach(sec => {
      const chip = document.createElement('label');
      const checked = _examSelectedSections.includes(sec.id);
      chip.style.cssText = `display:flex;align-items:center;gap:8px;padding:8px 10px;background:${checked?'#eff6ff':'#f8fafc'};border:1.5px solid ${checked?'#93c5fd':'#e2e8f0'};border-radius:10px;cursor:pointer;transition:all .15s;font-size:11px;font-weight:600`;
      chip.innerHTML = `<div id="esec-chk-${sec.id}" style="width:15px;height:15px;border-radius:4px;border:2px solid ${checked?'#3b82f6':'#cbd5e1'};background:${checked?'#3b82f6':'#fff'};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:900">${checked?'✓':''}</div><span>${sec.className} › ${sec.name}</span>`;
      chip.onclick = () => _toggleExamSection(sec.id, chip);
      secEl.appendChild(chip);
    });
  } catch(e) { console.error('_loadExamSections error:', e); }
}

function _toggleExamSection(sectionId, chip) {
  const idx = _examSelectedSections.indexOf(sectionId);
  const chk = document.getElementById(`esec-chk-${sectionId}`);
  if (idx >= 0) {
    _examSelectedSections.splice(idx, 1);
    chip.style.background = '#f8fafc'; chip.style.borderColor = '#e2e8f0';
    if (chk) { chk.textContent=''; chk.style.background='#fff'; chk.style.borderColor='#cbd5e1'; }
  } else {
    _examSelectedSections.push(sectionId);
    chip.style.background = '#eff6ff'; chip.style.borderColor = '#93c5fd';
    if (chk) { chk.textContent='✓'; chk.style.background='#3b82f6'; chk.style.borderColor='#3b82f6'; }
  }
}

// Override submitAddExam to use multi-class selection
async function submitAddExam() {
  const title = (document.getElementById('f-title')?.value || '').trim();
  if (!title) { alert('Please enter exam title'); return; }
  if (!_cachedClasses || !_cachedClasses.length) {
    alert('⚠️ No classes available. Please add at least one class first before scheduling an exam.');
    return;
  }
  if (!_examSelectedClasses.length) { alert('Please select at least one class'); return; }

  const classesToSchedule = _cachedClasses.filter(c => _examSelectedClasses.includes(c.id));

  const baseBody = {
    title,
    subject:    document.getElementById('f-subject')?.value || '',
    date:       document.getElementById('f-date')?.value || '',
    time:       document.getElementById('f-time')?.value || '',
    duration:   document.getElementById('f-duration')?.value || '',
    room:       document.getElementById('f-room')?.value || '',
    totalMarks: document.getElementById('f-totalMarks')?.value || '100',
  };

  let successCount = 0;
  let errors = [];

  for (const cls of classesToSchedule) {
    const body = { ...baseBody, cls: cls.code || cls.name, class_id: cls.id };
    // If specific sections selected for this class
    if (_examSelectedSections.length && _cachedSectionsByClass[cls.id]) {
      const clsSections = (_cachedSectionsByClass[cls.id] || []).filter(s => _examSelectedSections.includes(s.id));
      if (clsSections.length) {
        for (const sec of clsSections) {
          const sBody = { ...body, section_id: sec.id, title: classesToSchedule.length > 1 || clsSections.length > 1 ? `${title} — ${cls.code} ${sec.name}` : title };
          try {
            const res = await fetch('/api/exams', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(sBody)});
            const data = await res.json();
            if (data.success) successCount++; else errors.push(data.error);
          } catch(e) { errors.push(e.message); }
        }
        continue;
      }
    }
    // No specific sections → one exam per class
    const clsTitle = classesToSchedule.length > 1 ? `${title} — ${cls.code}` : title;
    try {
      const res = await fetch('/api/exams', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...body, title: clsTitle})});
      const data = await res.json();
      if (data.success) successCount++; else errors.push(data.error);
    } catch(e) { errors.push(e.message); }
  }

  if (successCount > 0) {
    closeModal();
    await loadAllDataFromDB();
    if (errors.length) alert(`✅ ${successCount} exam(s) scheduled.\n⚠️ Some failed: ${errors.join(', ')}`);
  } else {
    alert('Error scheduling exam: ' + (errors[0] || 'Unknown'));
  }
}


// ================================================================
// SUB-ADMIN CLASS PICKER  (multi-select chip UI)
// ================================================================

async function initSubAdminClassPicker(preSelected = []) {
  subAdminClassesSelected = Array.isArray(preSelected) ? [...preSelected] : [];
  try {
    if (!_cachedClasses) {
      const res = await fetch('/api/classes/dropdown');
      _cachedClasses = await res.json();
    }
    const el = document.getElementById('sa-class-list');
    if (!el) return;
    el.innerHTML = _cachedClasses.length ? '' : '<div style="color:#94a3b8;font-size:12px;padding:8px">No classes found. Add classes first.</div>';
    _cachedClasses.forEach(cls => {
      const checked = subAdminClassesSelected.includes(cls.id);
      const chip = document.createElement('label');
      chip.style.cssText = `display:flex;align-items:center;gap:8px;padding:9px 11px;background:${checked?'#f5f3ff':'#f8fafc'};border:1.5px solid ${checked?'#c4b5fd':'#e2e8f0'};border-radius:10px;cursor:pointer;transition:all .15s;font-size:12px;font-weight:700`;
      chip.innerHTML = `<div id="sacls-chk-${cls.id}" style="width:16px;height:16px;border-radius:4px;border:2px solid ${checked?'#7c3aed':'#cbd5e1'};background:${checked?'#7c3aed':'#fff'};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:900">${checked?'✓':''}</div><span>${cls.name} (${cls.code})</span>`;
      chip.onclick = () => _toggleSAClass(cls.id, chip);
      el.appendChild(chip);
    });
  } catch(e) {
    console.error('initSubAdminClassPicker error:', e);
  }
}

function _toggleSAClass(classId, chip) {
  const idx = subAdminClassesSelected.indexOf(classId);
  const chk = document.getElementById(`sacls-chk-${classId}`);
  if (idx >= 0) {
    subAdminClassesSelected.splice(idx, 1);
    chip.style.background = '#f8fafc'; chip.style.borderColor = '#e2e8f0';
    if (chk) { chk.textContent=''; chk.style.background='#fff'; chk.style.borderColor='#cbd5e1'; }
  } else {
    subAdminClassesSelected.push(classId);
    chip.style.background = '#f5f3ff'; chip.style.borderColor = '#c4b5fd';
    if (chk) { chk.textContent='✓'; chk.style.background='#7c3aed'; chk.style.borderColor='#7c3aed'; }
  }
}

// Override submitAddSubAdmin to include class access
const _origSubmitAddSubAdmin = typeof submitAddSubAdmin === 'function' ? submitAddSubAdmin : null;

async function submitAddSubAdmin() {
  const name = (document.getElementById('f-name')?.value || '').trim();
  const username = (document.getElementById('f-username')?.value || '').trim();
  const password = (document.getElementById('f-password')?.value || '').trim();
  if (!name) { alert('Please enter a name'); return; }
  if (!username) { alert('Please enter a username'); return; }
  if (!password) { alert('Please enter a password'); return; }
  if (username === 'admin') { alert("Username 'admin' is reserved"); return; }
  try {
    const res = await fetch('/api/subadmins', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name, username, password, permissions: subAdminPermsSelected, allowed_classes: subAdminClassesSelected})});
    const data = await res.json();
    if (data.success) {
      alert(`✅ Sub-Admin Created!\n\nUsername: ${username}\nPassword: ${password}${subAdminClassesSelected.length ? '\nClass Access: ' + subAdminClassesSelected.length + ' class(es)' : '\nClass Access: All classes'}`);
      closeModal(); await loadAllDataFromDB();
    } else { alert('Error: ' + (data.error || 'Unknown')); }
  } catch(e) { alert('Server error: ' + e.message); }
}

// Override submitEditSubAdmin to include class access
async function submitEditSubAdmin(id) {
  const name = (document.getElementById('f-name')?.value || '').trim();
  const username = (document.getElementById('f-username')?.value || '').trim();
  const pwd = (document.getElementById('f-password')?.value || '').trim();
  if (!name) { alert('Name cannot be empty'); return; }
  if (!username) { alert('Username cannot be empty'); return; }
  const body = {name, username, permissions: subAdminPermsSelected, allowed_classes: subAdminClassesSelected};
  if (pwd) body.password = pwd;
  try {
    const res = await fetch(`/api/subadmins/${id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    const data = await res.json();
    if (data.success) {
      if (currentUser && currentUser.id === id) { currentUser.name = name; currentUser.permissions = [...subAdminPermsSelected]; }
      alert('✅ Sub-admin updated!'); closeModal(); await loadAllDataFromDB();
    } else { alert('Error: ' + (data.error || 'Unknown')); }
  } catch(e) { alert('Server error: ' + e.message); }
}