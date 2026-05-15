/* ================================================================
   js/student.js  —  NEXus Solution CMS
   ================================================================ */
// ================================================================
// SECTION 27 — STUDENT PAGES
// ----------------------------------------------------------------
// renderStudentPage()      — router + portal-revoked guard.
// renderStudentDash(s)     — welcome banner + attendance/grade summary.
// renderStudentAtt(s)      — view own attendance calendar.
// renderStudentGrades(s)   — view own subject marks & grade.
// renderStudentAssignments(s) — view + submit assignments.
// renderStudentFees(s)     — view fee vouchers and installment status.
// renderStudentTT()        — view class timetable.
// renderStudentExams(s)    — view upcoming exam schedule.
// renderNoticesView()      — shared notice board (teacher+student).
// ================================================================
function renderStudentPage(){
  const s=students.find(x=>x.id===currentUser.id);
  if(!s)return `<div style="text-align:center;padding:60px;color:${T.red}">Student not found.</div>`;
  if(s.portal!=="active")return `<div style="display:flex;height:100%;align-items:center;justify-content:center;padding:40px">${card(`<div style="text-align:center;padding:48px"><div style="font-size:56px;margin-bottom:16px">🔒</div><div style="font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:20px;margin-bottom:10px">Portal Access Revoked</div><div style="color:${T.muted};font-size:14px">Contact the college admin to restore access.</div></div>`)}</div>`;
  switch(currentPage){case "dashboard":return renderStudentDash(s);case "attendance":return renderStudentAtt(s);case "grades":return renderStudentGrades(s);case "assignments":return renderStudentAssignments(s);case "fees":return renderStudentFees(s);case "timetable":return renderStudentTT();case "exams":return renderStudentExams(s);case "notices":return renderNoticesView();default:return renderStudentDash(s);}
}

function renderStudentDash(s){
  const ma=attendance[s.id]||{},allDates=Object.keys(ma).sort();
  const pd=allDates.filter(d=>ma[d]==="present").length,attPct=allDates.length?Math.round(pd/allDates.length*100):0;
  const mg=grades[s.id]||{};
  const studentSubjects=SUBJECT_GROUPS[s.subjectGroup||"Computer Science"]||SUBJECT_GROUPS["Computer Science"];
  const tots=studentSubjects.map(sub=>mg[sub]?.total||0).filter(x=>x>0);
  const avg=tots.length?Math.round(tots.reduce((a,b)=>a+b,0)/tots.length):0;
  const myEx=exams.filter(e=>e.cls===s.cls);
  const myAssignA=assignments.filter(a=>a.cls===s.cls);
  const mySubs=submissions.filter(sub=>sub.studentId===s.id);
  const pendingA=myAssignA.filter(a=>!mySubs.some(sub=>sub.assignmentId===a.id));
  // Use weekDays for chart so it always shows latest 5 working days
  const chartDays=weekDays.length?weekDays:(allDates.slice(-5));
  const attData=chartDays.map(d=>ma[d]==="present"?100:ma[d]==="late"?50:0);
  const dayLabels=chartDays.map(d=>new Date(d).toLocaleDateString("en",{weekday:"short",month:"short",day:"numeric"}));
  scheduleChart(()=>drawBarChart('sAttChartDash',dayLabels,[{label:'Attendance',data:attData,color:T.accent}],{maxVal:100}),'sAttChartDash');
  return `<div style="background:linear-gradient(135deg,${T.accentD},${T.accent});border-radius:18px;padding:24px 28px;margin-bottom:22px;display:flex;align-items:center;gap:18px;flex-wrap:wrap;box-shadow:0 4px 20px rgba(5,150,105,.3)">
    ${ava(s.name,56,s.photo||null)}<div style="flex:1"><div style="font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:20px;color:#fff">Welcome, ${esc(s.name)}!</div><div style="font-size:13px;color:rgba(255,255,255,.7);margin-top:4px">📚 ${s.cls} · Roll# ${s.rollNo} · ${s.id}</div><div style="font-size:11px;color:rgba(255,255,255,.6);margin-top:3px">🎓 ${s.subjectGroup||"Computer Science"} Group &nbsp;·&nbsp; ${studentSubjects.join(", ")}</div></div>
    <div>${badge(s.feeStatus,"lg")}</div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin-bottom:22px">
    ${statCard("✅",`${attPct}%`,"Attendance",attPct>=75?T.green:T.red,`${pd} days`)}${statCard("📈",avg||"-","Avg Score",gradeColor(avg||0),gradeLabel(avg||0))}${statCard("💳",s.feeStatus,"Fee",s.feeStatus==="paid"?T.green:T.red)}${statCard("📎",pendingA.length,"Pending Tasks",T.blue,"Assignments")}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
    ${card(`${secTitle("📊 My Attendance This Week")}<canvas id="sAttChartDash" width="420" height="160" style="width:100%;height:160px"></canvas>`)}
    ${card(`${secTitle("📝 Upcoming Exams")}<div style="display:grid;gap:10px">${myEx.length===0?`<div style="color:${T.muted};font-size:13px;text-align:center;padding:16px">No exams scheduled</div>`:myEx.map(e=>`<div style="background:${T.bg};border-radius:10px;padding:12px;border-left:3px solid ${T.accent}"><div style="font-weight:700;font-size:13px">${esc(e.title)} — ${e.subject}</div><div style="font-size:11px;color:${T.muted};margin-top:4px">📅 ${e.date} · 🕐 ${e.time} · 🚪 ${e.room}</div></div>`).join("")}</div>`)}
  </div>`;}

function renderStudentAtt(s){
  const ma=attendance[s.id]||{},dates=Object.keys(ma).sort();
  const pd=dates.filter(d=>ma[d]==="present").length,ad=dates.filter(d=>ma[d]==="absent").length,ld=dates.filter(d=>ma[d]==="late").length;
  const pct=dates.length?Math.round(pd/dates.length*100):0;
  // Show all available dates sorted — full history
  const dayLabels=dates.map(d=>new Date(d).toLocaleDateString("en",{month:"short",day:"numeric"}));
  const attBarData=dates.map(d=>ma[d]==="present"?100:ma[d]==="late"?50:0);
  scheduleChart(()=>drawBarChart('sAttTrend',dayLabels,[{label:'Attendance',data:attBarData,color:T.accent}],{maxVal:100}),'sAttTrend');
  return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
    ${statCard("📊",`${pct}%`,"Overall",pct>=75?T.green:T.red)}${statCard("✅",pd,"Present",T.green)}${statCard("❌",ad,"Absent",T.red)}${statCard("⏰",ld,"Late",T.yellow)}
  </div>
  ${pct<75?`<div style="background:${T.redL};border:1px solid #fca5a5;border-radius:12px;padding:14px 18px;margin-bottom:18px;display:flex;gap:10px;align-items:center"><span style="font-size:20px">⚠️</span><div><strong style="color:${T.red}">Low Attendance Warning!</strong><span style="font-size:13px;color:${T.red};margin-left:6px">Below 75%.</span></div></div>`:""}
  ${card(`${secTitle("Attendance Trend")}<canvas id="sAttTrend" width="600" height="160" style="width:100%;height:160px"></canvas>`,"margin-bottom:16px")}
  ${card(tblHtml(["Date","Day","Status"],[...dates].reverse().map(d=>[`<span style="font-weight:600">${d}</span>`,new Date(d).toLocaleDateString("en-PK",{weekday:"long"}),badge(ma[d])])),"",0)}`;}

function renderStudentGrades(s){
  const studentSubjects=SUBJECT_GROUPS[s.subjectGroup||"Computer Science"]||SUBJECT_GROUPS["Computer Science"];
  const mg=grades[s.id]||{},tots=studentSubjects.map(sub=>mg[sub]?.total||0).filter(x=>x>0);
  const avg=tots.length?Math.round(tots.reduce((a,b)=>a+b,0)/tots.length):0;
  const subLabels=studentSubjects.map(sub=>sub.split(" ")[0]);
  const gradeData=studentSubjects.map(sub=>mg[sub]?.total||0);
  scheduleChart(()=>drawBarChart('sGradesChart',subLabels,[{label:'Total Score (/100)',data:gradeData,color:T.accent}],{maxVal:100}));
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin-bottom:20px">
    ${statCard("📊",avg||"-","Average",gradeColor(avg||0),gradeLabel(avg||0))}${studentSubjects.map(sub=>{const g=mg[sub];return g?statCard("📚",g.total,sub.split(" ")[0],gradeColor(g.total),gradeLabel(g.total)):"";}).join("")}
  </div>
  ${card(`${secTitle("Grade Distribution")}<canvas id="sGradesChart" width="600" height="180" style="width:100%;height:180px"></canvas>`,"margin-bottom:16px")}
  ${card(tblHtml(["Subject","Midterm","Final","Internal","Total","Grade"],studentSubjects.map(sub=>{const g=mg[sub];return [`<span style="font-weight:700">${esc(sub)}</span>`,g?.midterm||"-",g?.final||"-",g?.internal||"-",`<span style="font-weight:800;color:${g?gradeColor(g.total):T.muted}">${g?.total||"-"}</span>`,g?`<span style="background:${gradeColor(g.total)}20;color:${gradeColor(g.total)};border-radius:20px;padding:3px 12px;font-weight:800;font-size:12px">${gradeLabel(g.total)}</span>`:"-"];})),"",0)}
  <div style="display:flex;gap:12px;margin-top:18px;flex-wrap:wrap">
    <button onclick="downloadStudentGradesPDF('${s.id}')" style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;border:none;border-radius:12px;padding:11px 22px;font-size:13px;font-weight:700;cursor:pointer">📄 Download Grade Sheet PDF</button>
    <button onclick="downloadMarksSheetExcel()" style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border:none;border-radius:12px;padding:11px 22px;font-size:13px;font-weight:700;cursor:pointer">📊 Download Excel</button>
  </div>`;}

function renderStudentAssignments(s){
  const myA   = assignments.filter(a => a.cls === s.cls);
  const mySubs= submissions.filter(sub => sub.studentId === s.id);
  const today = new Date(); today.setHours(0,0,0,0);

  return `${secTitle("📎 My Assignments")}
  ${myA.length===0
    ? card(`<div style="text-align:center;padding:56px;color:${T.muted}">
        <div style="font-size:56px;margin-bottom:14px">📭</div>
        <div style="font-weight:700;font-size:16px">No assignments posted yet</div>
        <div style="font-size:13px;margin-top:6px">Your teacher hasn't posted any assignments yet.</div>
      </div>`)
    : `<div style="display:grid;gap:16px">
      ${myA.map(a=>{
        const mySub   = mySubs.find(sub=>sub.assignmentId===a.id);
        const dueDate = a.dueDate ? new Date(a.dueDate) : null;
        if(dueDate) dueDate.setHours(0,0,0,0);
        const isOverdue = dueDate && dueDate < today;
        const isLate    = mySub && dueDate && (new Date(mySub.submittedAt||"") > dueDate);
        const totalMks  = a.totalMarks || 100;

        // Determine border colour and status badge
        let borderCol, statusBadge;
        if(mySub){
          if(mySub.status==="checked"){
            borderCol = T.green;
            statusBadge = `<span style="background:${T.greenL};color:${T.green};border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700">✅ Checked</span>`;
          } else if(mySub.status==="rejected"){
            borderCol = T.red;
            statusBadge = `<span style="background:${T.redL};color:${T.red};border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700">❌ Rejected</span>`;
          } else {
            borderCol = T.blue;
            statusBadge = `<span style="background:${T.blueL};color:${T.blue};border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700">📬 Submitted</span>`;
          }
        } else if(isOverdue){
          borderCol = T.red;
          statusBadge = `<span style="background:${T.redL};color:${T.red};border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700">⏰ Overdue</span>`;
        } else {
          borderCol = T.yellow;
          statusBadge = `<span style="background:${T.yellowL};color:${T.yellow};border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700">📋 Pending</span>`;
        }

        return `<div style="background:${T.surface};border:1.5px solid ${T.border};border-radius:16px;padding:22px;box-shadow:${T.shadow};border-left:5px solid ${borderCol}">

          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:14px">
            <div style="flex:1">
              <div style="font-weight:800;font-size:16px;margin-bottom:6px">${esc(a.title)}</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
                <span style="background:${T.accentL};color:${T.accentD};border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">📚 ${esc(a.subject)}</span>
                <span style="background:${T.purpleL||T.accentL};color:${T.purple||T.accent};border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">👨‍🏫 ${esc(a.teacherName)}</span>
                <span style="background:${T.blueL};color:${T.blue};border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">🏆 ${totalMks} marks</span>
                <span style="font-size:12px;color:${isOverdue&&!mySub?T.red:T.muted}">📅 Due: <strong>${a.dueDate||'—'}</strong></span>
              </div>
            </div>
            <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:6px">
              ${statusBadge}
              ${isLate?`<span style="background:${T.redL};color:${T.red};border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">⏰ Late Submission</span>`:''}
            </div>
          </div>

          ${a.description ? `<div style="background:${T.bg};border-radius:10px;padding:12px 14px;border-left:3px solid ${T.accent};font-size:13px;color:${T.text2};line-height:1.7;margin-bottom:14px">${esc(a.description)}</div>` : ""}

          ${a.attachData ? `
          <div style="margin-bottom:14px">
            <a href="${a.attachData}" download="${esc(a.attachName||'attachment')}"
              style="display:inline-flex;align-items:center;gap:8px;background:${T.blueL};color:${T.blue};border:1.5px solid #bfdbfe;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;text-decoration:none">
              📎 Teacher's Attachment: ${esc(a.attachName||'Download')}
            </a>
          </div>` : ""}

          ${mySub ? `
          <div style="background:${mySub.status==="checked"?"#f0fdf8":mySub.status==="rejected"?"#fef2f2":T.blueL};border:1.5px solid ${mySub.status==="checked"?T.green+"50":mySub.status==="rejected"?T.red+"50":"#bfdbfe"};border-radius:12px;padding:16px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:${(mySub.status==="checked"||mySub.status==="rejected")?"12px":"0"}">
              <div style="width:38px;height:38px;background:${mySub.status==="checked"?T.greenL:mySub.status==="rejected"?T.redL:T.blueL};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${mySub.status==="checked"?"✅":mySub.status==="rejected"?"❌":"📎"}</div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:13px">${esc(mySub.fileName||'Submitted')}</div>
                <div style="font-size:11px;color:${T.muted}">Submitted on ${mySub.submittedAt||'—'}</div>
              </div>
              ${mySub.fileData?`<a href="${mySub.fileData}" download="${esc(mySub.fileName||'file')}" style="display:inline-flex;align-items:center;gap:5px;background:${T.blueL};color:${T.blue};border:1px solid #bfdbfe;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;text-decoration:none">📥</a>`:''}
            </div>
            ${(mySub.status==="checked"||mySub.status==="rejected") ? `
            <div style="border-top:1px solid ${mySub.status==="checked"?T.green:T.red}30;padding-top:12px;display:grid;gap:10px">
              ${mySub.grade!=null ? `
              <div style="display:flex;align-items:center;gap:14px;background:#fff;border-radius:10px;padding:12px 16px;border:1px solid ${mySub.status==="checked"?T.green:T.red}30">
                <div style="text-align:center">
                  <div style="font-size:36px;font-weight:800;color:${gradeColor(Math.round((mySub.grade/(mySub.totalMarks||totalMks))*100)||0)};font-family:'Space Grotesk',sans-serif;line-height:1">${mySub.grade}</div>
                  <div style="font-size:10px;color:${T.muted};font-weight:600">out of ${mySub.totalMarks||totalMks}</div>
                </div>
                <div style="flex:1">
                  <div style="font-size:15px;font-weight:700;color:${gradeColor(Math.round((mySub.grade/(mySub.totalMarks||totalMks))*100)||0)}">${gradeLabel(Math.round((mySub.grade/(mySub.totalMarks||totalMks))*100)||0)}</div>
                  <div style="margin-top:8px;height:8px;background:${T.border};border-radius:99px;overflow:hidden">
                    <div style="height:100%;width:${Math.round((mySub.grade/(mySub.totalMarks||totalMks))*100)||0}%;background:${gradeColor(Math.round((mySub.grade/(mySub.totalMarks||totalMks))*100)||0)};border-radius:99px"></div>
                  </div>
                </div>
              </div>` : ""}
              ${mySub.feedback ? `
              <div style="background:#fff;border-radius:10px;padding:12px 16px;border:1px solid ${T.green}30;border-left:4px solid ${T.accent}">
                <div style="font-size:10px;font-weight:800;color:${T.accent};text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">📝 Teacher Remarks</div>
                <div style="font-size:14px;color:${T.text};font-weight:500;line-height:1.6">${esc(mySub.feedback)}</div>
              </div>` : ""}
            </div>` : ""}
          </div>
          ` : !isOverdue ? `
          <label style="cursor:pointer;display:block;margin-top:4px">
            <input type="file" style="display:none" onchange="submitAssignment('${a.id}','${s.id}','${esc(s.name)}','${s.cls}',this)"/>
            <span style="display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,${T.accent},${T.accentD});color:#fff;border-radius:12px;padding:12px 22px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px ${T.accent}40">
              📤 Upload & Submit Assignment
            </span>
            <span style="font-size:11px;color:${T.muted};margin-left:10px">PDF, DOC, Image — Max 10MB</span>
          </label>` : `
          <div style="background:${T.redL};border-radius:10px;padding:10px 14px;font-size:12px;color:${T.red};font-weight:600">
            ⏰ Submission deadline has passed.
          </div>`}

        </div>`;
      }).join("")}
    </div>`}`;
}