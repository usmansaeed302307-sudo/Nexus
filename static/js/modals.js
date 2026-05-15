/* ================================================================
   js/modals.js  —  NEXus Solution CMS
   ================================================================ */

function renderStudentFees(s){
  const vouchers=feeVouchers[s.id]||[];
  const plan=feeInstallments[s.id];
  return `${secTitle('My Fee Vouchers')}
  ${plan?`<div style="background:${T.surface};border:1px solid ${T.border};border-radius:16px;padding:22px;margin-bottom:18px;box-shadow:${T.shadow}">
    ${secTitle('📋 Installment Plan')}
    <div style="background:${T.bg};border-radius:10px;padding:10px 12px;margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:12px;color:${T.muted};margin-bottom:6px"><span>Total: <strong style="color:${T.text}">PKR ${plan.totalFee.toLocaleString()}</strong> · Session: ${plan.session||'—'}</span><span style="font-weight:700;color:${T.accent}">${(plan.installments||[]).filter(i=>i.status==='paid').length}/3 paid</span></div>${pbar(Math.round((plan.installments||[]).filter(i=>i.status==='paid').length/3*100),T.accent)}</div>
    <div style="display:grid;gap:8px">${(plan.installments||[]).map(inst=>{const iCol={paid:T.green,pending:T.yellow,overdue:T.red}[inst.status]||T.muted;return `<div style="background:${iCol}10;border:1px solid ${iCol}30;border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><div><div style="font-size:13px;font-weight:700">Installment ${inst.no} · <span style="color:${T.accent}">PKR ${inst.amount.toLocaleString()}</span></div><div style="font-size:11px;color:${T.muted};margin-top:2px">📄 ${inst.voucherNo} · Due: ${inst.dueDate}${inst.status==='paid'?` · Paid: ${inst.paidDate}`:''}</div></div><span style="background:${iCol}20;color:${iCol};border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;text-transform:capitalize">${inst.status}</span></div>`;}).join('')}</div>
    <div style="margin-top:14px">${pbtn('🧾 Download Fee Receipt',`downloadFeeReceipt('${s.id}')`)}</div>
  </div>`:''}<div style="display:grid;gap:14px">${vouchers.length===0?card(`<div style="text-align:center;padding:40px;color:${T.muted}">No fee vouchers found</div>`):vouchers.map(v=>`<div style="background:${T.surface};border:1px solid ${T.border};border-radius:16px;padding:22px;box-shadow:${T.shadow};border-left:4px solid ${v.status==='paid'?T.green:v.status==='overdue'?T.red:T.yellow}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px">
      <div><div style="font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:17px;margin-bottom:14px">${esc(v.month)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${[['Voucher #',v.voucherNo],['Amount','PKR '+v.amount.toLocaleString()],['Due Date',v.dueDate],['Paid Date',v.paidDate||'Not paid']].map(([k,val])=>`<div><div style="font-size:10px;color:${T.muted};font-weight:700;text-transform:uppercase;letter-spacing:.06em">${k}</div><div style="font-size:14px;font-weight:700;margin-top:3px">${esc(String(val))}</div></div>`).join('')}</div></div>
      <div style="display:flex;flex-direction:column;gap:10px;align-items:flex-end">${badge(v.status,'lg')}${v.status!=='paid'?`<button style="background:${T.yellowL};color:${T.yellow};border:1px solid #fcd34d;border-radius:10px;padding:8px 16px;cursor:pointer;font-weight:700;font-size:13px">🏦 Pay Now</button>`:''}</div>
    </div>
  </div>`).join('')}</div>`;
}

function renderStudentTT(){const tt=timetables[teachers[0]?.id];return `${secTitle("Class Timetable")}${tt?card(`<div style="display:flex;align-items:center;gap:14px;margin-bottom:18px"><div style="width:52px;height:52px;background:${T.accentL};border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px">📅</div><div><div style="font-weight:700;font-size:15px">${esc(tt.name)}</div><div style="font-size:12px;color:${T.muted};margin-top:2px">Uploaded: ${tt.uploadedAt}</div></div></div>${tt.data.startsWith("data:image")?`<img src="${tt.data}" alt="timetable" style="width:100%;border-radius:12px;border:1px solid ${T.border}"/>`:pbtn("📎 Open Timetable","window.open(timetables[teachers[0].id].data)")}`)
  :card(`<div style="text-align:center;padding:56px;color:${T.muted}"><div style="font-size:56px;margin-bottom:14px">📭</div><div style="font-weight:700;font-size:16px">No timetable available yet</div></div>`)}`;}

function renderStudentExams(s){const myEx=exams.filter(e=>e.cls===s.cls);return `${secTitle(`My Exams — ${s.cls}`)}${myEx.length===0?card(`<div style="text-align:center;padding:40px;color:${T.muted}">No exams scheduled for ${s.cls}</div>`):myEx.map(e=>`<div style="background:${T.surface};border:1px solid ${T.border};border-radius:16px;padding:22px;margin-bottom:12px;box-shadow:${T.shadow};border-left:4px solid ${T.accent}"><div style="font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:16px;margin-bottom:14px">${esc(e.title)} — ${esc(e.subject)}</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px">${[["📅 Date",e.date],["🕐 Time",e.time],["⏱ Duration",e.duration],["🚪 Room",e.room],["📝 Marks",String(e.totalMarks)]].map(([k,v])=>`<div style="background:${T.bg};border-radius:10px;padding:10px 14px"><div style="font-size:10px;color:${T.muted};font-weight:700">${k}</div><div style="font-size:14px;font-weight:700;margin-top:3px">${esc(v)}</div></div>`).join("")}</div></div>`).join("")}`;}

// ═══════════════════════════════════════════════
// ================================================================
// SECTION 28 — MODALS
// ----------------------------------------------------------------
// renderModal() — returns the overlay + panel HTML for the
//                 currently open modal (modalState variable).
//
// Available modal types: addStudent, editStudent, addTeacher,
// editTeacher, addExam, addNotice, addComplaint, createAssignment,
// gradeSubmission, createFeePlan, editFeePlan, feeReport,
// changePassword, addSubAdmin, editSubAdmin
// ================================================================
function renderModal(){
  if(!modalState)return "";
  let title="",content="";

  // ─── CHANGE PASSWORD MODAL ───
  if(modalState==="changePassword"){
    title="🔑 Change Password";
    const role=currentUser.role;
    const isAdmin=role==="admin"&&!currentUser.isSubAdmin;
    content=`
    <div style="background:${T.accentL};border:1px solid ${T.border2};border-radius:10px;padding:12px 14px;margin-bottom:20px;font-size:12px;color:${T.accentD};font-weight:600;display:flex;gap:8px;align-items:center">
      <span>🔐</span>
      ${isAdmin?"Changing main admin password":"Changing your account password. You'll use this to log in next time."}
    </div>
    <div style="margin-bottom:14px"><label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase">Current Password</label><input type="password" id="cp-cur" placeholder="Enter current password" style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:13px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif"/></div>
    <div style="margin-bottom:14px"><label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase">New Password</label><input type="password" id="cp-new" placeholder="Minimum 4 characters" style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:13px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif"/></div>
    <div style="margin-bottom:18px"><label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase">Confirm New Password</label><input type="password" id="cp-conf" placeholder="Re-enter new password" style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:13px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif"/></div>
    <div id="cp-msg" style="margin-bottom:12px;font-size:13px;min-height:20px;text-align:center"></div>
    <button onclick="submitChangePassword()" style="width:100%;background:linear-gradient(135deg,${T.accent},${T.accentD});color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif">🔑 Update Password</button>`;
  }

  // ─── ADD SUB-ADMIN MODAL ───
  if(modalState==="addSubAdmin"||modalState==="editSubAdmin"){
    const isEdit=modalState==="editSubAdmin";
    const sa=isEdit?subAdmins.find(x=>x.id===formData._saId):null;
    title=isEdit?"✏️ Edit Sub-Admin":"👥 Add Sub-Admin";
    content=`
    ${fld("Full Name","f-name",isEdit?sa?.name||formData.name||"":formData.name||"")}
    ${fld("Username (for login)","f-username",isEdit?sa?.username||formData.username||"":formData.username||"","text",null,"e.g. registrar")}
    ${isEdit?`<div style="margin-bottom:14px"><label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase">New Password <span style="font-weight:400;text-transform:none">(leave blank to keep)</span></label><input type="password" id="f-password" placeholder="Leave blank to keep current" style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:13px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif" oninput="setForm('f-password',this.value)"/></div>`:
    fld("Password","f-password",formData.password||"","password",null,"Set a login password")}
    <div style="margin-bottom:18px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Permissions (select what this sub-admin can access)</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" id="perm-grid">
        ${SUB_ADMIN_PERMS.map(p=>{const checked=(isEdit?(sa?.permissions||[]):(subAdminPermsSelected)).includes(p.key);return `<label style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:${checked?T.purpleL:T.bg};border:1.5px solid ${checked?"#c4b5fd":T.border};border-radius:10px;cursor:pointer;transition:all .15s" onclick="togglePermCheck('${p.key}',this)">
          <div style="width:18px;height:18px;border-radius:5px;border:2px solid ${checked?T.purple:T.border};background:${checked?T.purple:"#fff"};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:800" id="pchk-${p.key}">${checked?"✓":""}</div>
          <div><div style="font-size:12px;font-weight:700;color:${T.text}">${p.label}</div><div style="font-size:10px;color:${T.muted}">${p.desc}</div></div>
        </label>`;}).join("")}
      </div>
    </div>
    <div style="margin-bottom:18px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Class Access <span style="font-weight:400;text-transform:none;font-size:10px">(leave blank = all classes)</span></label>
      <div id="sa-class-list" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:150px;overflow-y:auto;padding:2px">
        <div style="color:${T.muted};font-size:12px;padding:8px">Loading classes…</div>
      </div>
    </div>
    <button onclick="${isEdit?`submitEditSubAdmin('${sa?.id}')`:"submitAddSubAdmin()"}" style="width:100%;background:linear-gradient(135deg,${T.purple},#6d28d9);color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif">${isEdit?"💾 Save Changes":"👥 Create Sub-Admin"}</button>`;
  setTimeout(()=>initSubAdminClassPicker(isEdit?sa?.allowedClasses||[]:subAdminClassesSelected),0);
  }

  if(modalState==="addStudent"){title="➕ Add New Student";content=`
    <div style="margin-bottom:18px"><label style="font-size:11px;color:${T.muted};display:block;margin-bottom:8px;font-weight:700;text-transform:uppercase">Profile Photo (Optional)</label>
      <div style="display:flex;align-items:center;gap:14px"><div id="stu-photo-preview" style="width:64px;height:64px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid ${T.border2};background:linear-gradient(135deg,${T.accent},${T.accentD});display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff">${formData._photoData?`<img src="${formData._photoData}" style="width:100%;height:100%;object-fit:cover"/>`:formData.name?formData.name[0].toUpperCase():"👤"}</div>
      <div style="flex:1"><label style="display:inline-flex;align-items:center;gap:8px;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:9px 16px;cursor:pointer;font-size:12px;font-weight:700;color:${T.accent}">📷 Choose Photo<input type="file" accept="image/*" style="display:none" onchange="previewStudentPhoto(this)"/></label>
      <div style="font-size:11px;color:${T.muted};margin-top:5px">JPG, PNG · Max 2MB</div></div></div></div>
    ${fld("Full Name","f-name",formData.name||"")}
    <div style="margin-bottom:14px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Class *</label>
      <select id="f-classId" onchange="onStudentClassChange(this.value,'f-sectionId')"
        style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:13px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif">
        <option value="">-- Loading classes… --</option>
      </select>
    </div>
    <div style="margin-bottom:14px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Section</label>
      <select id="f-sectionId"
        style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:13px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif">
        <option value="">-- Select a class first --</option>
      </select>
    </div>
    <div style="margin-bottom:14px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Subject Group</label>
      <select id="f-subjectGroup" onchange="setForm('f-subjectGroup',this.value);updateSubjectPreview('add-subject-preview',this.value)"
        style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:13px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif">
        ${ALL_GROUPS.map(g=>`<option value="${g}" ${(formData.subjectGroup||"Computer Science")===g?"selected":""}>${g}</option>`).join("")}
      </select>
      <div id="add-subject-preview" style="background:${T.bg};border:1px solid ${T.border};border-radius:8px;padding:8px 12px;margin-top:6px;font-size:11px;color:${T.muted}">
        📚 Subjects: <strong style="color:${T.accent}">${(SUBJECT_GROUPS[formData.subjectGroup||"Computer Science"]||[]).join(" · ")}</strong>
      </div>
    </div>
    ${fld("Password (for login)","f-password",formData.password||"1234","text",null,"Login password")}${fld("Phone","f-phone",formData.phone||"")}${fld("Guardian Phone","f-guardianPhone",formData.guardianPhone||"")}${fld("Email","f-email",formData.email||"")}${fld("Date of Birth","f-dob",formData.dob||"","date")}${fld("Fee Status","f-feeStatus",formData.feeStatus||"pending","text",["paid","pending","overdue"])}
    <div style="background:${T.accentL};border:1px solid ${T.border2};border-radius:10px;padding:11px 14px;font-size:12px;color:${T.accentD};margin-bottom:16px;font-weight:600">💡 Auto-generated ID + password = student login credentials.</div>
    <button onclick="submitAddStudent()" style="width:100%;background:linear-gradient(135deg,${T.accent},${T.accentD});color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer">Add Student</button>`;}

  if(modalState==="addTeacher"){title="➕ Add New Teacher";content=`
    <div style="margin-bottom:18px"><label style="font-size:11px;color:${T.muted};display:block;margin-bottom:8px;font-weight:700;text-transform:uppercase">Profile Photo (Optional)</label>
      <div style="display:flex;align-items:center;gap:14px"><div id="teach-photo-preview" style="width:64px;height:64px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid ${T.border2};background:linear-gradient(135deg,${T.accent},${T.accentD});display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff">${formData._photoData?`<img src="${formData._photoData}" style="width:100%;height:100%;object-fit:cover"/>`:formData.name?formData.name[0].toUpperCase():"👨‍🏫"}</div>
      <div style="flex:1"><label style="display:inline-flex;align-items:center;gap:8px;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:9px 16px;cursor:pointer;font-size:12px;font-weight:700;color:${T.accent}">📷 Choose Photo<input type="file" accept="image/*" style="display:none" onchange="previewTeacherPhoto(this)"/></label>
      <div style="font-size:11px;color:${T.muted};margin-top:5px">JPG, PNG · Max 2MB</div></div></div></div>
    ${fld("Full Name","f-name",formData.name||"")}
    ${fld("Subject","f-subject",formData.subject||SUBJECTS[0],"text",SUBJECTS)}
    <div class="teacher-form-row">
      <div>
        <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">🏫 Class</label>
        <select id="f-teachClassId" class="teacher-form-select" onchange="onTeacherClassChange(this.value,'f-teachSectionId')">
          <option value="">-- Select Class --</option>
        </select>
      </div>
      <div>
        <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">📋 Section</label>
        <select id="f-teachSectionId" class="teacher-form-select">
          <option value="">-- Select Class First --</option>
        </select>
      </div>
    </div>
    ${fld("Department","f-dept",formData.dept||"")}
    ${fld("Qualification","f-qualification",formData.qualification||"")}
    <div class="teacher-form-row-2">
      <div>${fld("Phone","f-phone",formData.phone||"")}</div>
      <div>${fld("Email","f-email",formData.email||"")}</div>
    </div>
    <button onclick="submitAddTeacher()" style="width:100%;background:linear-gradient(135deg,${T.accent},${T.accentD});color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px">Add Teacher</button>`;
  setTimeout(()=>initTeacherClassDropdown('f-teachClassId','f-teachSectionId',null,null),0);}

  if(modalState==="addExam"){title="📝 Schedule Exam";content=`
    ${fld("Exam Title","f-title",formData.title||"")}
    ${fld("Subject","f-subject",formData.subject||SUBJECTS[0],"text",SUBJECTS)}
    <div style="margin-bottom:14px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Classes * <span style="font-weight:400;text-transform:none;font-size:10px">(select one or more)</span></label>
      <div id="exam-class-list" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:160px;overflow-y:auto;padding:2px">
        <div style="color:${T.muted};font-size:12px;padding:8px">Loading classes…</div>
      </div>
    </div>
    <div style="margin-bottom:14px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Sections <span style="font-weight:400;text-transform:none;font-size:10px">(optional — leave blank for all)</span></label>
      <div id="exam-section-list" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:140px;overflow-y:auto;padding:2px">
        <div style="color:${T.muted};font-size:12px;padding:8px">Select a class first…</div>
      </div>
    </div>
    ${fld("Date","f-date",formData.date||"","date")}
    ${fld("Time","f-time",formData.time||"09:00 AM")}
    ${fld("Duration","f-duration",formData.duration||"3 hours")}
    ${fld("Room","f-room",formData.room||"")}
    ${fld("Total Marks","f-totalMarks",formData.totalMarks||"100")}
    <button onclick="submitAddExam()" style="width:100%;background:linear-gradient(135deg,${T.accent},${T.accentD});color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer">📅 Schedule Exam</button>`;
  setTimeout(()=>initExamClassPicker(),0);}

  if(modalState==="addNotice"){title="📢 Post Notice";content=`
    ${fld("Title","f-title",formData.title||"")}${fld("Type","f-type",formData.type||"academic","text",["academic","holiday","event","fee"])}${fld("Author","f-author",formData.author||"Principal")}
    <button onclick="submitAddNotice()" style="width:100%;background:linear-gradient(135deg,${T.accent},${T.accentD});color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer">Post Notice</button>`;}

  if(modalState==="viewStudent"){const s=formData;title="👤 Student Profile";
    content=`
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:18px;background:linear-gradient(135deg,${T.accentD},${T.accent});border-radius:14px;position:relative">
      <div style="position:relative">${ava(s.name||"?",72,s.photo||null)}<label style="position:absolute;bottom:0;right:0;width:24px;height:24px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.2);border:2px solid ${T.border2}">📷<input type="file" accept="image/*" style="display:none" onchange="changeStudentPhoto('${s.id}',this)"/></label></div>
      <div style="flex:1"><div style="font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:20px;color:#fff">${esc(s.name)}</div><div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:3px">${s.id} · ${s.cls} · Roll# ${s.rollNo}</div><div style="display:flex;gap:6px;margin-top:8px">${badge(s.feeStatus)}${badge(s.portal)}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px">
      ${[["📛 Full Name",s.name],["🆔 Student ID",s.id],["🏫 Class",s.cls],["📋 Roll No",s.rollNo],["📚 Subject Group",s.subjectGroup||"—"],["📞 Phone",s.phone],["👨‍👩‍👦 Guardian",s.guardianPhone],["✉️ Email",s.email],["🎂 Date of Birth",s.dob]].map(([lbl,val])=>`<div style="background:${T.bg};border-radius:10px;padding:11px 14px;border:1px solid ${T.border}"><div style="font-size:10px;color:${T.muted};font-weight:700;text-transform:uppercase;margin-bottom:4px">${lbl}</div><div style="font-size:13px;font-weight:600">${esc(String(val||"—"))}</div></div>`).join("")}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <button onclick="openEditStudent('${s.id}')" style="background:linear-gradient(135deg,${T.accent},${T.accentD});color:#fff;border:none;border-radius:12px;padding:12px;font-size:14px;font-weight:700;cursor:pointer">✏️ Edit Student</button>
      <button onclick="confirmDelStudent('${s.id}')" style="background:${T.redL};color:${T.red};border:1.5px solid #fca5a5;border-radius:12px;padding:12px;font-size:14px;font-weight:700;cursor:pointer">🗑️ Delete</button>
    </div>`;}

  if(modalState==="editStudent"){const s=formData;title="✏️ Edit Student";content=`
    <div style="margin-bottom:18px;display:flex;align-items:center;gap:14px">
      <div id="edit-stu-photo-preview" style="width:64px;height:64px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid ${T.border2}">${s.photo?`<img src="${s.photo}" style="width:100%;height:100%;object-fit:cover"/>`:ava(s.name,64)}</div>
      <label style="display:inline-flex;align-items:center;gap:8px;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:9px 16px;cursor:pointer;font-size:12px;font-weight:700;color:${T.accent}">📷 Change Photo<input type="file" accept="image/*" style="display:none" onchange="previewEditStuPhoto(this)"/></label>
    </div>
    ${fld("Full Name","f-name",s.name||"")}
    <div style="margin-bottom:14px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Class *</label>
      <select id="f-classId" onchange="onStudentClassChange(this.value,'f-sectionId')"
        style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:13px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif">
        <option value="">-- Loading classes… --</option>
      </select>
    </div>
    <div style="margin-bottom:14px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Section</label>
      <select id="f-sectionId"
        style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:13px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif">
        <option value="">-- Select a class first --</option>
      </select>
    </div>
    <div style="margin-bottom:14px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Subject Group</label>
      <select id="f-subjectGroup" onchange="setForm('f-subjectGroup',this.value);updateSubjectPreview('edit-subject-preview',this.value)"
        style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:13px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif">
        ${ALL_GROUPS.map(g=>`<option value="${g}" ${(s.subjectGroup||"Computer Science")===g?"selected":""}>${g}</option>`).join("")}
      </select>
      <div id="edit-subject-preview" style="background:${T.bg};border:1px solid ${T.border};border-radius:8px;padding:8px 12px;margin-top:6px;font-size:11px;color:${T.muted}">
        📚 Subjects: <strong style="color:${T.accent}">${(SUBJECT_GROUPS[s.subjectGroup||"Computer Science"]||[]).join(" · ")}</strong>
      </div>
    </div>
    ${fld("Phone","f-phone",s.phone||"")}${fld("Guardian Phone","f-guardianPhone",s.guardianPhone||"")}${fld("Email","f-email",s.email||"")}${fld("Date of Birth","f-dob",s.dob||"","date")}${fld("Fee Status","f-feeStatus",s.feeStatus||"pending","text",["paid","pending","overdue"])}${fld("New Password (leave blank to keep)","f-password","","text",null,"Leave blank to keep")}
    <button onclick="submitEditStudent('${s.id}')" style="width:100%;background:linear-gradient(135deg,${T.accent},${T.accentD});color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer;margin-top:6px">💾 Save Changes</button>`;}

  if(modalState==="editTeacher"){const t=formData;title="✏️ Edit Teacher";content=`
    <div style="margin-bottom:18px;display:flex;align-items:center;gap:14px">
      <div id="edit-teach-photo-preview" style="width:64px;height:64px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid ${T.border2}">${t.photo?`<img src="${t.photo}" style="width:100%;height:100%;object-fit:cover"/>`:ava(t.name,64)}</div>
      <label style="display:inline-flex;align-items:center;gap:8px;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:9px 16px;cursor:pointer;font-size:12px;font-weight:700;color:${T.accent}">📷 Change Photo<input type="file" accept="image/*" style="display:none" onchange="previewEditTeachPhoto(this)"/></label>
    </div>
    ${fld("Full Name","f-name",t.name||"")}
    ${fld("Subject","f-subject",t.subject||SUBJECTS[0],"text",SUBJECTS)}
    <div class="teacher-form-row">
      <div>
        <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">🏫 Class</label>
        <select id="f-teachClassId" class="teacher-form-select" onchange="onTeacherClassChange(this.value,'f-teachSectionId')">
          <option value="">-- Loading… --</option>
        </select>
      </div>
      <div>
        <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">📋 Section</label>
        <select id="f-teachSectionId" class="teacher-form-select">
          <option value="">-- Select Class First --</option>
        </select>
      </div>
    </div>
    ${fld("Department","f-dept",t.dept||"")}
    ${fld("Qualification","f-qualification",t.qualification||"")}
    <div class="teacher-form-row-2">
      <div>${fld("Phone","f-phone",t.phone||"")}</div>
      <div>${fld("Email","f-email",t.email||"")}</div>
    </div>
    ${fld("New Password (leave blank to keep)","f-password","","text",null,"Leave blank to keep")}
    <button onclick="submitEditTeacher('${t.id}')" style="width:100%;background:linear-gradient(135deg,${T.accent},${T.accentD});color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer;margin-top:6px">💾 Save Changes</button>`;
  setTimeout(()=>initTeacherClassDropdown('f-teachClassId','f-teachSectionId',t.classId||t.class_id||null,t.sectionId||t.section_id||null),0);}

  if(modalState==="addComplaint"){
    const t=teachers.find(x=>x.id===currentUser?.id);
    const tSubj=t?.subject;
    const eligGrps=SUBJECT_TO_GROUPS[tSubj]||(tSubj?Object.keys(SUBJECT_GROUPS).filter(g=>(SUBJECT_GROUPS[g]||[]).includes(tSubj)):[]);
    const cs=eligGrps.length?students.filter(s=>eligGrps.includes(s.subjectGroup||"Computer Science")):students;
    const sel=students.find(s=>s.id===formData.studentId)||cs[0];
    title="⚠️ Send Complaint";
    content=`<div style="background:${T.redL};border:1px solid #fca5a5;border-radius:10px;padding:11px 14px;margin-bottom:18px;font-size:12px;color:${T.red};font-weight:600">⚠️ This complaint is logged and visible to Admin.</div>
    <div style="margin-bottom:14px"><label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Select Student</label><select id="f-studentId" style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:14px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif;-webkit-appearance:none" onchange="setForm('f-studentId',this.value)">${cs.map(s=>`<option value="${esc(s.id)}" ${s.id===formData.studentId?"selected":""}>${esc(s.name)} — ${esc(s.cls)}</option>`).join("")}</select></div>
    ${sel?`<div style="background:${T.bg};border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:${T.muted};border:1px solid ${T.border}">👨‍👩‍👦 Guardian: <strong>${sel.guardianPhone}</strong></div>`:""}
    <div style="margin-bottom:14px"><label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase">Complaint Message</label><textarea id="f-message" rows="4" oninput="formData.message=this.value" style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:13px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif;resize:vertical">${esc(formData.message||"")}</textarea></div>
    ${sel&&formData.message?`<a href="sms:${sel.guardianPhone}?body=${encodeURIComponent(`Dear Guardian, regarding ${sel.name}: ${formData.message} - ${t?.name||""}, CMS`)}" style="display:block;text-align:center;background:${T.greenL};color:${T.green};border:1px solid #86efac;border-radius:10px;padding:10px;font-size:13px;font-weight:700;margin-bottom:12px">💬 Send SMS to Guardian</a>`:""}
    <button onclick="submitComplaint()" style="width:100%;background:linear-gradient(135deg,${T.red},#b91c1c);color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer">Log Complaint</button>`;}

  if(modalState==="editAssignment"){
    const teacher = teachers.find(x=>x.id===currentUser?.id);
    title = "✏️ Edit Assignment";
    // Build class list same as create
    const clsOptions = window.dbClasses||[];
    const tClasses   = formData._tClasses||[];
    const allCls = clsOptions.length>0
      ? clsOptions.map(c=>c.code||c.name||c)
      : tClasses.length>0 ? tClasses : [...new Set(students.map(s=>s.cls).filter(Boolean))].sort();
    const curCls = formData.cls || allCls[0] || "";
    const isSaving = formData._saving || false;

    content = `
    ${fld("Assignment Title","f-title",formData.title||"")}
    <div style="margin-bottom:14px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Subject</label>
      <div style="background:${T.accentL};border:1.5px solid ${T.border2};border-radius:10px;padding:10px 14px;color:${T.accentD};font-size:14px;font-weight:700">
        📚 ${esc(formData.subject||teacher?.subject||"")}
      </div>
    </div>
    <div style="margin-bottom:14px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Class / Section *</label>
      <select id="f-cls" onchange="formData.cls=this.value"
        style="width:100%;background:#fff;border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:14px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif">
        ${allCls.map(c=>`<option value="${esc(c)}" ${c===curCls?"selected":""}>${esc(c)}</option>`).join("")}
      </select>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
      <div>
        <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Due Date *</label>
        <input type="date" id="f-dueDate" value="${formData.dueDate||""}" oninput="formData.dueDate=this.value"
          style="width:100%;background:#fff;border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:14px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif"/>
      </div>
      <div>
        <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Total Marks *</label>
        <input type="number" id="f-totalMarks" value="${formData.totalMarks||100}" min="1" max="1000" oninput="formData.totalMarks=this.value"
          style="width:100%;background:#fff;border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:14px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif"/>
      </div>
    </div>
    <div style="margin-bottom:14px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase">Description / Instructions</label>
      <textarea id="f-description" rows="4" oninput="formData.description=this.value"
        placeholder="Write assignment instructions here..."
        style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:13px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif;resize:vertical">${esc(formData.description||"")}</textarea>
    </div>
    <div style="margin-bottom:20px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Attachment</label>
      ${formData._existingAttach ? `
      <div style="display:flex;align-items:center;gap:10px;background:${T.blueL};border:1.5px solid #bfdbfe;border-radius:10px;padding:10px 14px;margin-bottom:8px">
        <span style="font-size:16px">📎</span>
        <span style="font-size:13px;color:${T.blue};font-weight:600;flex:1">${esc(formData._existingAttach)}</span>
        <button onclick="formData._existingAttach='';formData._removeAttach=true;render()"
          style="background:${T.redL};color:${T.red};border:1px solid #fca5a5;border-radius:8px;padding:3px 10px;font-size:11px;font-weight:700;cursor:pointer">✕ Remove</button>
      </div>` : ""}
      <label style="cursor:pointer;display:block">
        <input type="file" id="f-attachment" accept=".pdf,.doc,.docx,.jpg,.png,.zip" style="display:none"
          onchange="formData._attachName=this.files[0]?.name||'';formData._attachFile=this.files[0];document.getElementById('edit-att-label').textContent=this.files[0]?.name||'No file chosen'"/>
        <div style="display:flex;align-items:center;gap:10px;background:${T.bg};border:1.5px dashed ${T.border};border-radius:10px;padding:12px 16px">
          <span style="font-size:18px">📁</span>
          <span id="edit-att-label" style="font-size:13px;color:${T.muted};font-weight:600">
            ${formData._attachName||"Click to replace attachment…"}
          </span>
        </div>
      </label>
      <div style="font-size:11px;color:${T.muted};margin-top:5px">PDF, DOC, Image, ZIP — Max 10MB. Leave empty to keep existing file.</div>
    </div>
    <button onclick="submitEditAssignment()" ${isSaving?"disabled":""}
      style="width:100%;background:${isSaving?"#94a3b8":"linear-gradient(135deg,"+T.accent+","+T.accentD+")"};color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:${isSaving?"not-allowed":"pointer"};font-family:'Plus Jakarta Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px">
      ${isSaving
        ? `<span style="display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin .6s linear infinite"></span> Saving...`
        : "✏️ Save Changes"}
    </button>`;
  }

  if(modalState==="deleteAssignment"){
    title = "🗑️ Delete Assignment";
    const isDeleting = formData._deleting || false;
    content = `
    <div style="text-align:center;padding:10px 0 20px">
      <div style="font-size:56px;margin-bottom:16px">🗑️</div>
      <div style="font-weight:800;font-size:17px;color:${T.text};margin-bottom:10px">Delete Assignment?</div>
      <div style="background:${T.redL};border:1.5px solid #fca5a5;border-radius:12px;padding:14px 18px;margin-bottom:20px">
        <div style="font-size:14px;font-weight:700;color:${T.red};margin-bottom:6px">📎 ${esc(formData._delTitle||"")}</div>
        <div style="font-size:12px;color:${T.red};line-height:1.6">
          This will permanently delete:<br>
          • The assignment and all its details<br>
          • All student submissions for this assignment<br>
          This action <strong>cannot be undone</strong>.
        </div>
      </div>
      <div style="display:flex;gap:10px">
        <button onclick="closeModal()"
          style="flex:1;background:${T.bg};color:${T.text};border:1.5px solid ${T.border};border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif">
          Cancel
        </button>
        <button onclick="executeDeleteAssignment()" id="del-asgn-btn"
          style="flex:1;background:linear-gradient(135deg,${T.red},#b91c1c);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px">
          ${isDeleting
            ? `<span style="display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin .6s linear infinite"></span> Deleting...`
            : `🗑️ Yes, Delete`}
        </button>
      </div>
    </div>`;
  }

  if(modalState==="createAssignment"){
    const teacher = teachers.find(x=>x.id===currentUser?.id);
    title = "📎 Create Assignment";
    // Determine available classes for this teacher
    const clsOptions = window.dbClasses||[];
    const tClasses = formData._tClasses||[];
    const allCls = clsOptions.length>0
      ? clsOptions.map(c=>c.code||c.name||c)
      : tClasses.length>0 ? tClasses : [...new Set(students.map(s=>s.cls).filter(Boolean))].sort();
    const curCls = formData.cls || allCls[0] || "";
    const clsSelectHtml = `
      <div style="margin-bottom:14px">
        <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Class / Section *</label>
        <select id="f-cls" onchange="formData.cls=this.value"
          style="width:100%;background:#fff;border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:14px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif">
          ${allCls.map(c=>`<option value="${esc(c)}" ${c===curCls?"selected":""}>${esc(c)}</option>`).join("")}
        </select>
      </div>`;
    content=`
    ${fld("Assignment Title","f-title",formData.title||"")}
    <div style="margin-bottom:14px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Subject</label>
      ${currentUser.role==="teacher"
        ? `<div style="background:${T.accentL};border:1.5px solid ${T.border2};border-radius:10px;padding:10px 14px;color:${T.accentD};font-size:14px;font-weight:700">📚 ${esc(formData.subject||teacher?.subject||"")}</div><input type="hidden" id="f-subject" value="${esc(formData.subject||teacher?.subject||"")}"/>`
        : `<select id="f-subject" style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:14px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif;-webkit-appearance:none" onchange="setForm('f-subject',this.value)">${SUBJECTS.map(s=>`<option value="${s}" ${s===(formData.subject||SUBJECTS[0])?"selected":""}>${s}</option>`).join("")}</select>`
      }
    </div>
    ${clsSelectHtml}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
      <div>
        <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Due Date *</label>
        <input type="date" id="f-dueDate" value="${formData.dueDate||""}" oninput="formData.dueDate=this.value"
          style="width:100%;background:#fff;border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:14px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif"/>
      </div>
      <div>
        <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Total Marks *</label>
        <input type="number" id="f-totalMarks" value="${formData.totalMarks||100}" min="1" max="1000" oninput="formData.totalMarks=this.value"
          style="width:100%;background:#fff;border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:14px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif"/>
      </div>
    </div>
    <div style="margin-bottom:14px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase">Description / Instructions</label>
      <textarea id="f-description" rows="4" oninput="formData.description=this.value" placeholder="Write assignment instructions here..."
        style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:13px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif;resize:vertical">${esc(formData.description||"")}</textarea>
    </div>
    <div style="margin-bottom:20px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Attachment (Optional)</label>
      <label style="cursor:pointer;display:block">
        <input type="file" id="f-attachment" accept=".pdf,.doc,.docx,.jpg,.png,.zip" style="display:none"
          onchange="formData._attachName=this.files[0]?.name||'';formData._attachFile=this.files[0];document.getElementById('att-label').textContent=this.files[0]?.name||'No file chosen'"/>
        <div style="display:flex;align-items:center;gap:10px;background:${T.bg};border:1.5px dashed ${T.border};border-radius:10px;padding:12px 16px">
          <span style="font-size:20px">📎</span>
          <span id="att-label" style="font-size:13px;color:${T.muted};font-weight:600">${formData._attachName||"Click to attach a file…"}</span>
        </div>
      </label>
      <div style="font-size:11px;color:${T.muted};margin-top:5px">PDF, DOC, Image, ZIP — Max 10MB</div>
    </div>
    <button onclick="submitCreateAssignment()" style="width:100%;background:linear-gradient(135deg,${T.blue},#1d4ed8);color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif">📎 Create Assignment</button>`;}

  if(modalState==="gradeSubmission"){
    title="✏️ Grade Submission";
    const sub=submissions.find(s=>s.id===formData.subId);
    const asgn=sub?assignments.find(a=>a.id===sub.assignmentId):null;
    const totalMks=asgn?.totalMarks||100;
    const curStatus=formData.subStatus||sub?.status||"submitted";
    const statusColors={submitted:[T.yellow,T.yellowL,"⏳ Submitted"],checked:[T.green,T.greenL,"✅ Checked"],rejected:[T.red,T.redL,"❌ Rejected"]};
    const [sc,scl,sl]=statusColors[curStatus]||statusColors["submitted"];
    const isLate=sub?.isLate||false;

    content = sub ? `
    <!-- Student Card -->
    <div style="background:${T.bg};border:1.5px solid ${T.border};border-radius:14px;padding:16px;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        ${ava(sub.studentName,44)}
        <div style="flex:1">
          <div style="font-weight:800;font-size:16px">${esc(sub.studentName)}</div>
          <div style="font-size:11px;color:${T.muted};margin-top:3px">🕐 Submitted: ${sub.submittedAt||"—"}</div>
          ${isLate?`<span style="background:${T.redL};color:${T.red};border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">⏰ Late</span>`:""}
        </div>
        <span style="background:${scl};color:${sc};border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700">${sl}</span>
      </div>
      ${sub.studentComment?`<div style="background:${T.accentL};border-radius:8px;padding:10px 12px;font-size:12px;color:${T.text2};margin-bottom:10px;border-left:3px solid ${T.accent}"><strong>Student's note:</strong> ${esc(sub.studentComment)}</div>`:""}
      <!-- File download -->
      ${sub.fileData
        ? `<a href="${sub.fileData}" download="${esc(sub.fileName||'file')}"
            style="display:inline-flex;align-items:center;gap:8px;background:${T.blueL};color:${T.blue};border:1.5px solid #bfdbfe;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;text-decoration:none">
            📥 Download: ${esc(sub.fileName||'file')}
           </a>`
        : `<div style="background:${T.bg};border:1px solid ${T.border};border-radius:8px;padding:8px 12px;font-size:12px;color:${T.muted}">📎 ${esc(sub.fileName||'No file attached')}</div>`}
    </div>

    <!-- Status -->
    <div style="margin-bottom:16px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:8px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Submission Status</label>
      <div style="display:flex;gap:8px">
        ${[["submitted","⏳ Pending",T.yellow,T.yellowL],["checked","✅ Checked",T.green,T.greenL],["rejected","❌ Rejected",T.red,T.redL]].map(([val,lbl,clr,bg])=>
          `<button onclick="formData.subStatus='${val}';render()"
            style="flex:1;background:${curStatus===val?clr:bg};color:${curStatus===val?'#fff':clr};border:2px solid ${clr};border-radius:10px;padding:9px 6px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif">
            ${lbl}
          </button>`
        ).join("")}
      </div>
    </div>

    <!-- Marks -->
    <div style="margin-bottom:16px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Marks Obtained (out of ${totalMks}) *</label>
      <input type="number" id="f-grade" value="${formData.grade!=null&&formData.grade!==''?formData.grade:''}"
        min="0" max="${totalMks}" placeholder="e.g. ${Math.round(totalMks*0.85)}"
        style="width:100%;background:#fff;border:1.5px solid ${T.border};border-radius:10px;padding:12px 14px;color:${T.text};font-size:18px;font-weight:700;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif"
        oninput="formData.grade=this.value"/>
    </div>

    <!-- Quick Remark Buttons -->
    <div style="margin-bottom:10px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:8px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Quick Remarks</label>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${["Excellent work! 🌟","Very Good 👍","Good effort 😊","Needs improvement 📝","Well done! ✅","Incomplete — redo 🔄","Plagiarism detected ⚠️"].map(r=>
          `<button onclick="document.getElementById('f-feedback').value='${r}';formData.feedback='${r}'"
            style="background:${T.accentL};color:${T.accentD};border:1.5px solid ${T.border2};border-radius:8px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif">
            ${r}
          </button>`
        ).join("")}
      </div>
    </div>

    <!-- Feedback textarea -->
    <div style="margin-bottom:20px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Teacher Remarks</label>
      <textarea id="f-feedback" rows="3" oninput="formData.feedback=this.value"
        placeholder="Write detailed feedback for the student..."
        style="width:100%;background:#fff;border:1.5px solid ${T.border};border-radius:10px;padding:11px 14px;color:${T.text};font-size:13px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif;resize:vertical">${esc(formData.feedback||"")}</textarea>
    </div>

    <button onclick="submitGrade()"
      style="width:100%;background:linear-gradient(135deg,${T.green},${T.accentD});color:#fff;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif">
      ✅ Save Marks & Remarks
    </button>
    ` : `<div style="text-align:center;padding:30px;color:${T.muted}">Submission not found.</div>`;
  }

  if(modalState==="createFeePlan"||modalState==="editFeePlan"){
    const isEdit=modalState==="editFeePlan";
    const sid=formData._sid||"";
    const s=students.find(x=>x.id===sid);
    const plan=isEdit?feeInstallments[sid]:null;
    title=isEdit?"✏️ Edit Fee Plan":"💳 Create 3-Installment Fee Plan";
    const tf=formData.totalFee||plan?.totalFee||"";
    const sess=formData.session||plan?.session||"2025-26";
    const d1=formData.due1||(plan?.installments?.[0]?.dueDate)||"";
    const d2=formData.due2||(plan?.installments?.[1]?.dueDate)||"";
    const d3=formData.due3||(plan?.installments?.[2]?.dueDate)||"";
    const instAmt=tf?Math.floor(Number(tf)/3):0;
    content=`
    <div style="background:${T.accentL};border:1px solid ${T.border2};border-radius:10px;padding:11px 14px;margin-bottom:18px;font-size:12px;color:${T.accentD};font-weight:600">
      🎓 Student: <strong>${s?s.name+" ("+s.id+")":"—"}</strong>
    </div>
    ${fld("Academic Session","f-session",sess,"text",["2024-25","2025-26","2026-27"])}
    <div style="margin-bottom:14px">
      <label style="font-size:11px;color:${T.muted};display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase">Total Fee Amount (PKR)</label>
      <input type="number" id="f-totalFee" value="${tf}" placeholder="e.g. 45000" min="0"
        style="width:100%;background:${T.bg};border:1.5px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.text};font-size:13px;box-sizing:border-box;outline:none;font-family:'Plus Jakarta Sans',sans-serif"
        oninput="formData.totalFee=this.value;document.getElementById('fp-preview').innerHTML=feeInstallPreview(this.value)"/>
    </div>
    <div id="fp-preview" style="background:${T.bg};border:1px solid ${T.border};border-radius:10px;padding:12px;margin-bottom:14px;font-size:12px;text-align:center;color:${T.muted}">${tf?feeInstallPreview(tf):"Enter total fee to see installment breakdown"}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">
      ${fld("Installment 1 Due","f-due1",d1,"date")}
      ${fld("Installment 2 Due","f-due2",d2,"date")}
      ${fld("Installment 3 Due","f-due3",d3,"date")}
    </div>
    <button onclick="${isEdit?`submitEditFeePlan('${sid}')`:`submitCreateFeePlan('${sid}')`}" style="width:100%;background:linear-gradient(135deg,${T.accent},${T.accentD});color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif">${isEdit?"💾 Save Changes":"🚀 Create Plan & Generate Vouchers"}</button>`;
  }

  if(modalState==="feeReport"){title="📊 Fee Report Summary";
    const paidC=students.filter(s=>s.feeStatus==="paid").length;
    const pendC=students.filter(s=>s.feeStatus==="pending").length;
    const ovdC=students.filter(s=>s.feeStatus==="overdue").length;
    const totalCol=paidC*15000;
    content=`<div style="display:grid;gap:12px;margin-bottom:18px">
      ${[["✅ Paid",paidC,T.green,"PKR "+totalCol.toLocaleString()+" collected"],["⏳ Pending",pendC,T.yellow,"PKR "+(pendC*15000).toLocaleString()+" expected"],["🚨 Overdue",ovdC,T.red,"PKR "+(ovdC*15000).toLocaleString()+" overdue"]].map(([l,c,col,sub])=>`<div style="background:${col}10;border:1px solid ${col}30;border-radius:12px;padding:16px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:700;font-size:13px">${l}</div><div style="font-size:12px;color:${T.muted};margin-top:2px">${sub}</div></div><div style="font-size:28px;font-weight:800;color:${col};font-family:'Space Grotesk',sans-serif">${c}</div></div>`).join("")}
    </div>
    <div style="background:${T.accentL};border-radius:10px;padding:14px;text-align:center;margin-bottom:16px"><div style="font-size:12px;color:${T.muted};font-weight:600;margin-bottom:4px">TOTAL MONTHLY COLLECTION</div><div style="font-size:24px;font-weight:800;color:${T.accent};font-family:'Space Grotesk',sans-serif">PKR ${totalCol.toLocaleString()}</div></div>
    <button onclick="closeModal()" style="width:100%;background:linear-gradient(135deg,${T.accent},${T.accentD});color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer">Close</button>`;}

  return `<div onclick="closeModal()" style="position:fixed;inset:0;background:rgba(6,78,59,.45);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px">
    <div onclick="event.stopPropagation()" style="background:#fff;border-radius:20px;padding:30px;width:100%;max-width:${modalState==="addSubAdmin"||modalState==="editSubAdmin"?"580px":"520px"};max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.25)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <span style="font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:18px;color:${T.text}">${title}</span>
        <button onclick="closeModal()" style="background:${T.bg};border:none;color:${T.muted};border-radius:10px;width:34px;height:34px;cursor:pointer;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center">✕</button>
      </div>${content}
    </div>
  </div>`;}

// ================================================================
// SECTION 29 — ACTIONS  (Event Handlers)
// ----------------------------------------------------------------
// All onclick="" handlers used in the rendered HTML live here.
//
// Navigation
//   navTo(p)            — change page, reset search, re-render
//   toggleSidebar()     — collapse / expand sidebar
//   doLogout()          — clear currentUser, back to login
//
// Modal helpers
//   openModal(type)     — set modalState + seed formData, re-render
//   closeModal()        — clear modalState + formData, re-render
//   setForm(id, val)    — sync a form field value into formData
//
// CRUD — Students
//   submitAddStudent()  — validate + push new student
//   submitEditStudent() — validate + update existing student
//   delStudent(id)      — confirm + splice from array
//   previewStudentPhoto / previewEditStudentPhoto
//
// CRUD — Teachers
//   submitAddTeacher / submitEditTeacher / delTeacher
//
// CRUD — Exams
//   submitAddExam / delExam
//
// CRUD — Notices
//   submitAddNotice / delNotice
//
// Attendance
//   markAtt(sid, status)  — mark single student attendance
//   bulkAtt(status)       — mark all visible students
//
// Grades
//   updateGrade(sid, sub, field, val)
//   saveExamGrade(sid, sub, examId, val)
//
// Fees
//   submitCreateFeePlan / submitEditFeePlan / removeFeePlan
//   markInstallmentPaid / revertInstallmentPaid / setInstallmentOverdue
//
// Assignments
//   submitCreateAssignment / submitGrade / uploadAssignment
//
// Portals
//   togglePortal(type, id)
//
// Sub-admins
//   submitAddSubAdmin / submitEditSubAdmin / delSubAdmin
//   toggleSubAdminPerm(key)
//
// Password
//   submitChangePassword
// ================================================================
function navTo(p){currentPage=p;searchQuery="";render();}
function toggleSidebar(){
  if(window.innerWidth<=768){
    sidebarCollapsed=!sidebarCollapsed;
  } else {
    sidebarCollapsed=!sidebarCollapsed;
  }
  render();
}
function doLogout(){currentUser=null;loginErr="";loginRole="admin";render();}
function closeModal(){modalState=null;formData={};subAdminPermsSelected=[];render();}
function updateSubjectPreview(previewId,group){
  const el=document.getElementById(previewId);
  if(el){const subs=SUBJECT_GROUPS[group]||[];el.innerHTML='📚 Subjects: <strong style="color:'+T.accent+'">'+subs.join(" · ")+"</strong>";}
}
function setForm(id,val){formData[id.replace("f-","")]=val;}

function openModal(type){
  if(type==="addStudent")formData={name:"",cls:"CS-A",classId:null,sectionId:null,subjectGroup:"Computer Science",phone:"",guardianPhone:"",email:"",feeStatus:"pending",dob:"",password:"1234",_photoData:null};
  else if(type==="addTeacher")formData={name:"",subject:SUBJECTS[0],dept:"Computer Science",phone:"",email:"",qualification:"",_photoData:null};
  else if(type==="addExam")formData={title:"",subject:SUBJECTS[0],cls:"CS-A",date:"",time:"09:00 AM",duration:"3 hours",room:"",totalMarks:"100"};
  else if(type==="addNotice")formData={title:"",type:"academic",author:"Principal"};
  else if(type==="addComplaint"){const t=teachers.find(x=>x.id===currentUser?.id);const tSubj=t?.subject;const eligGrps=SUBJECT_TO_GROUPS[tSubj]||(tSubj?Object.keys(SUBJECT_GROUPS).filter(g=>(SUBJECT_GROUPS[g]||[]).includes(tSubj)):[]);const cs=eligGrps.length?students.filter(s=>eligGrps.includes(s.subjectGroup||"Computer Science")):students;formData={studentId:cs[0]?.id||"",message:""};}
  else if(type==="createAssignment"){const t=teachers.find(x=>x.id===currentUser?.id);const tSubj=t?.subject;const eligGrps=SUBJECT_TO_GROUPS[tSubj]||(tSubj?Object.keys(SUBJECT_GROUPS).filter(g=>(SUBJECT_GROUPS[g]||[]).includes(tSubj)):[]);const tClasses=eligGrps.length?[...new Set(students.filter(s=>eligGrps.includes(s.subjectGroup||"Computer Science")).map(s=>s.cls).filter(Boolean))].sort():[...new Set(students.map(s=>s.cls).filter(Boolean))].sort();formData={title:"",subject:tSubj||SUBJECTS[0],cls:tClasses[0]||"",dueDate:"",description:"",_tClasses:tClasses};}
  else if(type==="feeReport")formData={};
  else if(type==="changePassword")formData={};
  else if(type==="addSubAdmin"){formData={name:"",username:"",password:""};subAdminPermsSelected=[];}
  modalState=type;render();
  // Init dynamic class/section dropdowns for student forms
  if (type === 'addStudent') {
    initStudentClassDropdown(null, null);
  }
}

// ─── PASSWORD CHANGE HANDLER ───
function submitChangePassword(){
  const cur=document.getElementById("cp-cur")?.value||"";
  const n=document.getElementById("cp-new")?.value||"";
  const c=document.getElementById("cp-conf")?.value||"";
  const msg=document.getElementById("cp-msg");
  if(!cur||!n||!c){msg.innerHTML=`<span style="color:${T.red}">Please fill all fields.</span>`;return;}
  if(n.length<4){msg.innerHTML=`<span style="color:${T.red}">New password must be at least 4 characters.</span>`;return;}
  if(n!==c){msg.innerHTML=`<span style="color:${T.red}">New passwords do not match.</span>`;return;}

  const role=currentUser.role;
  if(role==="admin"&&!currentUser.isSubAdmin){
    if(cur!==adminPassword){msg.innerHTML=`<span style="color:${T.red}">Current password is incorrect.</span>`;return;}
    adminPassword=n;
  } else if(role==="admin"&&currentUser.isSubAdmin){
    const sa=subAdmins.find(x=>x.id===currentUser.id);
    if(!sa||cur!==sa.password){msg.innerHTML=`<span style="color:${T.red}">Current password is incorrect.</span>`;return;}
    sa.password=n;
  } else if(role==="teacher"){
    const t=teachers.find(x=>x.id===currentUser.id);
    if(!t||cur!==t.password){msg.innerHTML=`<span style="color:${T.red}">Current password is incorrect.</span>`;return;}
    t.password=n;
  } else if(role==="student"){
    const s=students.find(x=>x.id===currentUser.id);
    if(!s||cur!==s.password){msg.innerHTML=`<span style="color:${T.red}">Current password is incorrect.</span>`;return;}
    s.password=n;
  }
  msg.innerHTML=`<span style="color:${T.green};font-weight:700">✅ Password updated successfully! Use your new password next login.</span>`;
  setTimeout(()=>closeModal(),1800);
}

// ─── SUB-ADMIN PERMISSION TOGGLE ───
function togglePermCheck(key,el){
  const chk=document.getElementById("pchk-"+key);
  const idx=subAdminPermsSelected.indexOf(key);
  if(idx>=0){subAdminPermsSelected.splice(idx,1);chk.textContent="";chk.style.background="#fff";chk.style.borderColor=T.border;el.style.background=T.bg;el.style.borderColor=T.border;}
  else{subAdminPermsSelected.push(key);chk.textContent="✓";chk.style.background=T.purple;chk.style.borderColor=T.purple;el.style.background=T.purpleL;el.style.borderColor="#c4b5fd";}
}

// ─── ADD SUB-ADMIN ───
function submitAddSubAdmin(){
  const name=(document.getElementById("f-name")?.value||"").trim();
  const username=(document.getElementById("f-username")?.value||"").trim();
  const password=(document.getElementById("f-password")?.value||"").trim();
  if(!name){alert("Please enter a name");return;}
  if(!username){alert("Please enter a username");return;}
  if(!password){alert("Please enter a password");return;}
  if(username==="admin"){alert("Username 'admin' is reserved for the main admin");return;}
  if(subAdmins.some(x=>x.username===username)){alert("Username already taken. Choose a different one.");return;}
  const newSA={id:"SA"+Date.now(),name,username,password,permissions:[...subAdminPermsSelected],portal:"active",createdAt:today};
  subAdmins.push(newSA);
  alert(`✅ Sub-Admin Created!

Username: ${username}
Password: ${password}

They can log in using the Admin tab.`);
  closeModal();
}

// ─── EDIT SUB-ADMIN ───
function openEditSubAdmin(id){
  const sa=subAdmins.find(x=>x.id===id);
  if(sa){formData={...sa,_saId:id};subAdminPermsSelected=[...sa.permissions];subAdminClassesSelected=[...(sa.allowedClasses||[])];modalState="editSubAdmin";render();}
}
function submitEditSubAdmin(id){
  const sa=subAdmins.find(x=>x.id===id);if(!sa)return;
  const name=(document.getElementById("f-name")?.value||"").trim();
  const username=(document.getElementById("f-username")?.value||"").trim();
  const pwd=(document.getElementById("f-password")?.value||"").trim();
  if(!name){alert("Name cannot be empty");return;}
  if(!username){alert("Username cannot be empty");return;}
  if(username==="admin"){alert("Username 'admin' is reserved");return;}
  if(subAdmins.some(x=>x.username===username&&x.id!==id)){alert("Username already taken.");return;}
  sa.name=name;sa.username=username;
  if(pwd)sa.password=pwd;
  sa.permissions=[...subAdminPermsSelected];
  if(currentUser&&currentUser.id===id){currentUser.name=sa.name;currentUser.permissions=[...sa.permissions];}
  alert("✅ Sub-admin updated!");
  closeModal();
}
function toggleSubAdmin(id){const sa=subAdmins.find(x=>x.id===id);if(sa)sa.portal=sa.portal==="active"?"inactive":"active";refreshContent();}
function delSubAdmin(id){if(confirm("Delete this sub-admin?"))subAdmins=subAdmins.filter(x=>x.id!==id);refreshContent();}

// ─── PHOTO PREVIEW HELPERS ───
function previewStudentPhoto(input){const file=input.files[0];if(!file)return;if(file.size>2*1024*1024){alert("Photo too large. Max 2MB.");return;}const reader=new FileReader();reader.onload=ev=>{formData._photoData=ev.target.result;const prev=document.getElementById("stu-photo-preview");if(prev)prev.innerHTML=`<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover"/>`;};reader.readAsDataURL(file);}
function previewTeacherPhoto(input){const file=input.files[0];if(!file)return;if(file.size>2*1024*1024){alert("Photo too large. Max 2MB.");return;}const reader=new FileReader();reader.onload=ev=>{formData._photoData=ev.target.result;const prev=document.getElementById("teach-photo-preview");if(prev)prev.innerHTML=`<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover"/>`;};reader.readAsDataURL(file);}
function previewEditStuPhoto(input){const file=input.files[0];if(!file)return;if(file.size>2*1024*1024){alert("Photo too large. Max 2MB.");return;}const reader=new FileReader();reader.onload=ev=>{formData._photoData=ev.target.result;const prev=document.getElementById("edit-stu-photo-preview");if(prev)prev.innerHTML=`<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover"/>`;};reader.readAsDataURL(file);}
function previewEditTeachPhoto(input){const file=input.files[0];if(!file)return;if(file.size>2*1024*1024){alert("Photo too large. Max 2MB.");return;}const reader=new FileReader();reader.onload=ev=>{formData._photoData=ev.target.result;const prev=document.getElementById("edit-teach-photo-preview");if(prev)prev.innerHTML=`<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover"/>`;};reader.readAsDataURL(file);}

// ─── EDIT STUDENT / TEACHER ───
function openEditStudent(sid){const s=students.find(x=>x.id===sid);if(s){formData={...s,_photoData:null};modalState="editStudent";render();initStudentClassDropdown(s.classId||s.class_id||null, s.sectionId||s.section_id||null);}}
function openEditTeacher(tid){const t=teachers.find(x=>x.id===tid);if(t){formData={...t,_photoData:null};modalState="editTeacher";render();}}
// NOTE: confirmDelStudent is also defined in api.js (which loads after this file).
// The api.js version (which actually calls the backend) will override this one.
function confirmDelStudent(sid){if(confirm("Are you sure you want to delete this student?")){students=students.filter(s=>s.id!==sid);if(modalState==="viewStudent"||modalState==="editStudent"){closeModal();}else{refreshContent();}}}
function changeStudentPhoto(sid,input){const file=input.files[0];if(!file)return;if(file.size>2*1024*1024){alert("Photo too large. Maximum is 2MB.");return;}const reader=new FileReader();reader.onload=async ev=>{const s=students.find(x=>x.id===sid);if(s){s.photo=ev.target.result;formData={...s};}render();try{const res=await fetch(`/api/students/${sid}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({photo:ev.target.result})});const d=await res.json();if(!d.success)alert('Photo update failed: '+(d.error||'Unknown error'));}catch(e){console.error('Photo update error:',e);}};reader.readAsDataURL(file);}

// ─── NAVIGATION & ATTENDANCE ───
function openComplaint(sid){formData={studentId:sid,message:""};modalState="addComplaint";render();}
function viewStudent(sid){const s=students.find(x=>x.id===sid);if(s){formData={...s};modalState="viewStudent";render();}}
// NOTE: delStudent, delTeacher, delExam, submitEditStudent, submitEditTeacher,
//       submitAddStudent, submitAddTeacher, submitAddExam, submitAddNotice, submitComplaint
//       are ALL properly defined in api.js (loaded after this file).
//       Those api.js versions call the backend and reload data — they win.
function delNotice(nid){notices=notices.filter(n=>n.id!==nid);refreshContent();}
function markPaid(sid){const s=students.find(x=>x.id===sid);if(s){s.feeStatus="paid";const v=(feeVouchers[s.id]||[])[0];if(v){v.status="paid";v.paidDate=today;}refreshContent();}}
function revertFee(sid){if(!confirm("Revert paid status to Pending?"))return;const s=students.find(x=>x.id===sid);if(s){s.feeStatus="pending";const v=(feeVouchers[s.id]||[])[0];if(v){v.status="pending";v.paidDate=null;}refreshContent();}}
function setFeeStatus(sid,status){const s=students.find(x=>x.id===sid);if(s){s.feeStatus=status;const v=(feeVouchers[s.id]||[])[0];if(v){v.status=status;if(status==="paid")v.paidDate=today;else v.paidDate=null;}refreshContent();}}
function togglePortal(type,id){if(type==="student"){const s=students.find(x=>x.id===id);if(s)s.portal=s.portal==="active"?"inactive":"active";}else{const t=teachers.find(x=>x.id===id);if(t)t.portal=t.portal==="active"?"inactive":"active";}refreshContent();}
function bulkAtt(status){const filtered=students.filter(s=>{const cm=attFilter.class_id?(s.class_id===attFilter.class_id||s.classId===attFilter.class_id):s.cls===attFilter.cls;const sm=attFilter.section_id?(s.section_id===attFilter.section_id||s.sectionId===attFilter.section_id):true;return cm&&sm;});filtered.forEach(s=>{if(!attendance[s.id])attendance[s.id]={};attendance[s.id][attFilter.date]=status;});refreshContent();const payload={date:attFilter.date,status};if(attFilter.class_id){payload.class_id=attFilter.class_id;if(attFilter.section_id)payload.section_id=attFilter.section_id;}else{payload.cls=attFilter.cls;}fetch('/api/attendance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(e=>console.error('Bulk att error:',e));}
function bulkSubjectAtt(status,ids){ids.forEach(sid=>{if(!attendance[sid])attendance[sid]={};attendance[sid][attFilter.date]=status;});refreshContent();const t=teachers.find(x=>x.id===currentUser?.id);const subj=t?.subject||'';fetch('/api/attendance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subjectBulk:subj,cls:attFilter.cls,date:attFilter.date,status})}).catch(e=>console.error('Subject bulk att error:',e));}
function saveExamGrade(sid,subj,examId,val){if(!grades[sid])grades[sid]={};if(!grades[sid][subj])grades[sid][subj]={midterm:0,final:0,internal:0,total:0};grades[sid][subj]["exam_"+examId]=Number(val);}
function markAtt(sid,status){if(!attendance[sid])attendance[sid]={};attendance[sid][attFilter.date]=status;refreshContent();fetch('/api/attendance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId:sid,date:attFilter.date,status})}).catch(e=>console.error('Att error:',e));}
function updateGrade(sid,sub,field,val){if(!grades[sid])grades[sid]={};if(!grades[sid][sub])grades[sid][sub]={midterm:0,final:0,internal:0,total:0};grades[sid][sub][field]=Number(val);const g=grades[sid][sub];g.total=(g.midterm||0)+(g.final||0)+(g.internal||0);}
function uploadTT(tid,input){const file=input.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>{timetables[tid]={name:file.name,data:ev.target.result,uploadedAt:today};refreshContent();};r.readAsDataURL(file);}
function printReport(){window.print();}
function openGradeSubmission(subId){const sub=submissions.find(s=>s.id===subId);formData={subId,grade:sub?.grade??"" ,feedback:sub?.feedback||"",subStatus:sub?.status||"submitted"};modalState="gradeSubmission";render();}
async function submitAssignment(assignmentId,studentId,studentName,cls,input){
  const file=input.files[0];if(!file)return;
  if(file.size>10*1024*1024){alert("File too large. Maximum is 10MB.");return;}
  const reader=new FileReader();
  reader.onload=async ev=>{
    try{
      const comment=window.prompt("Add a comment for your teacher (optional):","") || "";
      const res=await fetch(`/api/assignments/${assignmentId}/submit`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({fileName:file.name,fileData:ev.target.result,studentComment:comment})
      });
      const data=await res.json();
      if(data.success){alert("✅ Assignment submitted!");await loadAllDataFromDB();}
      else{alert("Error: "+(data.error||"Unknown"));}
    }catch(e){alert("Server error: "+e.message);}
  };
  reader.readAsDataURL(file);
}
async function submitGrade(){
  const subId=formData.subId;
  const asgn=submissions.find(s=>s.id===subId);
  const totalMks=asgn?((assignments.find(a=>a.id===asgn.assignmentId)?.totalMarks)||100):100;
  const gradeVal=document.getElementById("f-grade")?.value||formData.grade||"";
  const grade=parseFloat(gradeVal);
  const feedback=document.getElementById("f-feedback")?.value||formData.feedback||"";
  const subStatus=formData.subStatus||"checked";
  if(gradeVal===""||isNaN(grade)||grade<0||grade>totalMks){alert(`Please enter a valid mark (0–${totalMks})`);return;}
  try{
    const res=await fetch(`/api/submissions/${subId}/grade`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({grade,feedback,status:subStatus,totalMarks:totalMks})});
    const data=await res.json();
    if(data.success){
      const sub=submissions.find(s=>s.id===subId);
      if(sub){sub.grade=grade;sub.feedback=feedback;sub.status=subStatus;}
      closeModal();
      await loadAllDataFromDB();
    } else {
      alert("Error: "+(data.error||"Unknown"));
    }
  } catch(e){alert("Server error: "+e.message);}
}
// ─── EDIT ASSIGNMENT ─────────────────────────────────────────────
function openEditAssignment(aid){
  const a = assignments.find(x=>x.id===aid);
  if(!a){ _showToast("Assignment not found","error"); return; }
  const t = teachers.find(x=>x.id===currentUser?.id);
  const tSubj = t?.subject;
  const eligGrps = SUBJECT_TO_GROUPS[tSubj]||(tSubj?Object.keys(SUBJECT_GROUPS).filter(g=>(SUBJECT_GROUPS[g]||[]).includes(tSubj)):[]);
  const tClasses = eligGrps.length
    ? [...new Set(students.filter(s=>eligGrps.includes(s.subjectGroup||"Computer Science")).map(s=>s.cls).filter(Boolean))].sort()
    : [...new Set(students.map(s=>s.cls).filter(Boolean))].sort();
  formData = {
    _aid:           aid,
    title:          a.title        || "",
    subject:        a.subject      || tSubj || "",
    cls:            a.cls          || tClasses[0] || "",
    dueDate:        a.dueDate      || "",
    totalMarks:     a.totalMarks   || 100,
    description:    a.description  || "",
    _existingAttach:a.attachName   || "",
    _removeAttach:  false,
    _attachName:    "",
    _attachFile:    null,
    _saving:        false,
    _tClasses:      tClasses,
  };
  modalState = "editAssignment";
  render();
}

async function submitEditAssignment(){
  const aid = formData._aid;
  if(!aid){ _showToast("No assignment selected","error"); return; }

  // Validation
  const title = (document.getElementById("f-title")?.value || formData.title || "").trim();
  if(!title){ _showToast("Please enter assignment title","error"); return; }

  const dueDate = document.getElementById("f-dueDate")?.value || formData.dueDate || "";
  if(!dueDate){ _showToast("Please set a due date","error"); return; }

  const cls = document.getElementById("f-cls")?.value || formData.cls || "";
  if(!cls){ _showToast("Please select a class","error"); return; }

  const totalMarks = parseInt(document.getElementById("f-totalMarks")?.value || formData.totalMarks || 100);
  if(isNaN(totalMarks)||totalMarks<1){ _showToast("Please enter valid total marks","error"); return; }

  const description = document.getElementById("f-description")?.value ?? formData.description ?? "";

  // Handle attachment
  let attachName = "", attachData = "";
  const attachFile = formData._attachFile;
  if(attachFile){
    if(attachFile.size > 10*1024*1024){ _showToast("Attachment too large. Max 10MB","error"); return; }
    attachData = await new Promise(res=>{ const r=new FileReader(); r.onload=ev=>res(ev.target.result); r.readAsDataURL(attachFile); });
    attachName = attachFile.name;
  }

  // Show loading
  formData._saving = true;
  render();

  const body = {
    title, dueDate, cls, totalMarks, description,
    attachName: attachData ? attachName : "",
    attachData: attachData || "",
    removeAttach: formData._removeAttach || false,
  };

  try{
    const res = await fetch(`/api/assignments/${aid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if(res.ok && data.success){
      // Update local array for instant UI refresh
      const idx = assignments.findIndex(a=>a.id===aid);
      if(idx>=0) assignments[idx] = { ...assignments[idx], ...data.assignment };
      closeModal();
      refreshContent();
      _showToast("✅ Assignment updated successfully!", "success");
    } else {
      formData._saving = false;
      render();
      _showToast("❌ " + (data.error || "Failed to update"), "error");
    }
  } catch(e){
    formData._saving = false;
    render();
    _showToast("❌ Server error: " + e.message, "error");
  }
}

// ─── DELETE ASSIGNMENT ───────────────────────────────────────────
function confirmDeleteAssignment(aid, title){
  formData = { _delId: aid, _delTitle: title, _deleting: false };
  modalState = "deleteAssignment";
  render();
}

async function executeDeleteAssignment(){
  const aid = formData._delId;
  if(!aid) return;

  // Show loading state
  formData._deleting = true;
  render();

  try{
    const res = await fetch(`/api/assignments/${aid}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    const data = await res.json();

    if(res.ok && data.success){
      closeModal();
      // Remove from local array for instant UI update
      assignments = assignments.filter(a => a.id !== aid);
      submissions = submissions.filter(s => s.assignmentId !== aid);
      refreshContent();
      _showToast("✅ Assignment deleted successfully!", "success");
    } else {
      formData._deleting = false;
      render();
      _showToast("❌ " + (data.error || "Failed to delete"), "error");
    }
  } catch(e){
    formData._deleting = false;
    render();
    _showToast("❌ Server error: " + e.message, "error");
  }
}

// Toast helper (works with existing CMS toast or fallback)
function _showToast(msg, type="success"){
  if(typeof showToast === "function"){ showToast(msg, type); return; }
  if(typeof cmToast  === "function"){ cmToast(msg, type);   return; }
  const colors = {
    success: "background:#059669;color:#fff",
    error:   "background:#dc2626;color:#fff",
    info:    "background:#2563eb;color:#fff",
  };
  const t = document.createElement("div");
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:99999;padding:13px 22px;
    border-radius:12px;font-size:13px;font-weight:700;box-shadow:0 4px 20px rgba(0,0,0,.25);
    transition:opacity .3s;${colors[type]||colors.success}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=>{ t.style.opacity="0"; setTimeout(()=>t.remove(), 400); }, 3000);
}

async function submitCreateAssignment(){
  const title=(document.getElementById("f-title")?.value||formData.title||"").trim();
  if(!title){alert("Please enter assignment title");return;}
  const dueDate=document.getElementById("f-dueDate")?.value||formData.dueDate||"";
  if(!dueDate){alert("Please set a due date");return;}
  const totalMarks=parseInt(document.getElementById("f-totalMarks")?.value||formData.totalMarks||100);
  if(isNaN(totalMarks)||totalMarks<1){alert("Please enter valid total marks");return;}
  // Handle optional file attachment
  let attachName="", attachData="";
  const attachFile=formData._attachFile;
  if(attachFile){
    if(attachFile.size>10*1024*1024){alert("Attachment too large. Max 10MB.");return;}
    attachData=await new Promise(res=>{const r=new FileReader();r.onload=ev=>res(ev.target.result);r.readAsDataURL(attachFile);});
    attachName=attachFile.name;
  }
  const body={
    title,dueDate,totalMarks,
    subject:document.getElementById("f-subject")?.value||formData.subject||"",
    cls:document.getElementById("f-cls")?.value||formData.cls||"",
    description:document.getElementById("f-description")?.value||formData.description||"",
    attachName,attachData,
  };
  try{
    const res=await fetch("/api/assignments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const data=await res.json();
    if(data.success){closeModal();await loadAllDataFromDB();}
    else{alert("Error: "+(data.error||"Unknown"));}
  }catch(e){alert("Server error: "+e.message);}
}

// ================================================================
// SECTION 30 — PDF / EXCEL DOWNLOADS
// ----------------------------------------------------------------
// These functions open a new browser window with a print-ready
// HTML page, or trigger a CSV file download.
//
//   downloadReportPDF()          — current report → print window
//   downloadReportExcel()        — current report → .csv download
//   downloadPerformanceReport()  — class performance → print + CSV
//   downloadStudentGradesPDF(sid)— individual grade sheet → print
//   downloadMarksSheetExcel()    — all marks → .csv
//   printFeeVoucher(sid, no)     — single installment voucher → print
//   printInstallmentReceipt(sid, no) — paid receipt → print
// ================================================================