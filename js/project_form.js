const API_BASE_URL = 'http://27.254.144.167/api/v1';

let currentPlanId = null;
let currentProjectId = null;
let currentActivityId = null;

// ========================================
// Tab Management
// ========================================
function showTab(tabName) {
    // Hide all tabs
    document.getElementById('plansTab').style.display = 'none';
    document.getElementById('projectsTab').style.display = 'none';
    document.getElementById('activitiesTab').style.display = 'none';
    
    // Show selected tab
    if (tabName === 'plans') {
        document.getElementById('plansTab').style.display = 'block';
        loadPlans();
    } else if (tabName === 'projects') {
        document.getElementById('projectsTab').style.display = 'block';
        loadProjects();
    } else if (tabName === 'activities') {
        document.getElementById('activitiesTab').style.display = 'block';
        loadActivities();
    }
}

// ========================================
// 1. MASTER PLANS
// ========================================

// Load Plans
async function loadPlans() {
    try {
        const response = await fetch(`${API_BASE_URL}/master_plans`);
        const result = await response.json();
        
        if (result.status === 'success') {
            renderPlansTable(result.data);
        }
    } catch (error) {
        console.error('Error loading plans:', error);
    }
}

// Render Plans Table
function renderPlansTable(plans) {
    let html = `
        <table border="1" style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="padding: 10px;">ID</th>
                    <th style="padding: 10px;">ชื่อแผนงาน</th>
                    <th style="padding: 10px; width: 200px;">จัดการ</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (plans.length === 0) {
        html += '<tr><td colspan="3" style="text-align: center; padding: 20px;">ไม่มีข้อมูล</td></tr>';
    } else {
        plans.forEach(plan => {
            html += `
                <tr>
                    <td style="padding: 10px;">${plan.id}</td>
                    <td style="padding: 10px;">${plan.name}</td>
                    <td style="padding: 10px; text-align: center;">
                        <button onclick="openPlanModal('edit', ${plan.id}, '${plan.name}')">✏️ แก้ไข</button>
                        <button onclick="deletePlan(${plan.id})">🗑️ ลบ</button>
                    </td>
                </tr>
            `;
        });
    }
    
    html += '</tbody></table>';
    document.getElementById('plansTableArea').innerHTML = html;
}

// Open Plan Modal
function openPlanModal(mode, id = null, name = '') {
    currentPlanId = id;
    document.getElementById('planModalTitle').textContent = mode === 'create' ? 'เพิ่มแผนงาน' : 'แก้ไขแผนงาน';
    document.getElementById('planName').value = name;
    document.getElementById('planModal').style.display = 'block';
}

// Close Plan Modal
function closePlanModal() {
    document.getElementById('planModal').style.display = 'none';
    document.getElementById('planForm').reset();
    currentPlanId = null;
}

// Plan Form Submit
document.getElementById('planForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('planName').value.trim();
    if (!name) return;
    
    const data = { name };
    
    try {
        let url = `${API_BASE_URL}/master_plans`;
        let method = 'POST';
        
        if (currentPlanId) {
            url = `${API_BASE_URL}/master_plans/${currentPlanId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            closePlanModal();
            loadPlans();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error saving plan:', error);
        alert('เกิดข้อผิดพลาด');
    }
});

// Delete Plan
async function deletePlan(id) {
    if (!confirm('คุณต้องการลบแผนงานนี้ใช่หรือไม่?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/master_plans/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ลบสำเร็จ');
            loadPlans();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting plan:', error);
    }
}

// ========================================
// 2. MASTER PROJECTS
// ========================================

// Load Projects
async function loadProjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/master_projects`);
        const result = await response.json();
        
        if (result.status === 'success') {
            renderProjectsTable(result.data);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Render Projects Table
function renderProjectsTable(projects) {
    let html = `
        <table border="1" style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="padding: 10px;">ID</th>
                    <th style="padding: 10px;">ชื่อโครงการ</th>
                    <th style="padding: 10px; width: 200px;">จัดการ</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (projects.length === 0) {
        html += '<tr><td colspan="3" style="text-align: center; padding: 20px;">ไม่มีข้อมูล</td></tr>';
    } else {
        projects.forEach(project => {
            html += `
                <tr>
                    <td style="padding: 10px;">${project.id}</td>
                    <td style="padding: 10px;">${project.name}</td>
                    <td style="padding: 10px; text-align: center;">
                        <button onclick="openProjectModal('edit', ${project.id}, '${project.name}')">✏️ แก้ไข</button>
                        <button onclick="deleteProject(${project.id})">🗑️ ลบ</button>
                    </td>
                </tr>
            `;
        });
    }
    
    html += '</tbody></table>';
    document.getElementById('projectsTableArea').innerHTML = html;
}

// Open Project Modal
function openProjectModal(mode, id = null, name = '') {
    currentProjectId = id;
    document.getElementById('projectModalTitle').textContent = mode === 'create' ? 'เพิ่มโครงการ' : 'แก้ไขโครงการ';
    document.getElementById('projectName').value = name;
    document.getElementById('projectModal').style.display = 'block';
}

// Close Project Modal
function closeProjectModal() {
    document.getElementById('projectModal').style.display = 'none';
    document.getElementById('projectForm').reset();
    currentProjectId = null;
}

// Project Form Submit
document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('projectName').value.trim();
    if (!name) return;
    
    const data = { name };
    
    try {
        let url = `${API_BASE_URL}/master_projects`;
        let method = 'POST';
        
        if (currentProjectId) {
            url = `${API_BASE_URL}/master_projects/${currentProjectId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            closeProjectModal();
            loadProjects();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error saving project:', error);
        alert('เกิดข้อผิดพลาด');
    }
});

// Delete Project
async function deleteProject(id) {
    if (!confirm('คุณต้องการลบโครงการนี้ใช่หรือไม่?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/master_projects/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ลบสำเร็จ');
            loadProjects();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting project:', error);
    }
}

// ========================================
// 3. PROJECT ACTIVITIES
// ========================================

// Load Activities
async function loadActivities() {
    try {
        const response = await fetch(`${API_BASE_URL}/project_activities`);
        const result = await response.json();
        
        if (result.status === 'success') {
            renderActivitiesTable(result.data);
        }
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

// Render Activities Table
function renderActivitiesTable(activities) {
    let html = `
        <table border="1" style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="padding: 10px;">ชื่อกิจกรรม</th>
                    <th style="padding: 10px;">แผนงาน</th>
                    <th style="padding: 10px;">โครงการ</th>
                    <th style="padding: 10px;">ปีงบประมาณ</th>
                    <th style="padding: 10px;">ค่าใช้จ่าย</th>
                    <th style="padding: 10px;">เป้าหมาย</th>
                    <th style="padding: 10px; width: 200px;">จัดการ</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (activities.length === 0) {
        html += '<tr><td colspan="7" style="text-align: center; padding: 20px;">ไม่มีข้อมูล</td></tr>';
    } else {
        activities.forEach(act => {
            console.log("Activity:", act); 
            html += `
                <tr>
                    <td style="padding: 10px;">${act.activity_name}</td>
                    <td style="padding: 10px;">${act.plan_name || '-'}</td>
                    <td style="padding: 10px;">${act.project_name || '-'}</td>
                    <td style="padding: 10px;">${act.fiscal_year}</td>
                    <td stdtyle="padding: 10px;">${act.expenses || '-'}</td>
                    <td style="padding: 10px; text-align: center;">${act.target_goal || '-'}</td>
                    <td style="padding: 10px; text-align: center;">
                        <button onclick="openActivityModal('edit', ${act.id})">✏️ แก้ไข</button>
                        <button onclick="deleteActivity(${act.id})">🗑️ ลบ</button>
                    </td>
                </tr>
            `;
        });
    }
    
    html += '</tbody></table>';
    document.getElementById('activitiesTableArea').innerHTML = html;

    document.querySelectorAll('.btn-edit-activity').forEach(btn => {
        btn.addEventListener('click', () => openActivityModal('edit', btn.dataset.id));
    });
    document.querySelectorAll('.btn-delete-activity').forEach(btn => {
        btn.addEventListener('click', () => deleteActivity(btn.dataset.id));
    });
}

// Open Activity Modal
async function openActivityModal(mode, id = null) {
    currentActivityId = id;
    document.getElementById('activityModalTitle').textContent = mode === 'create' ? 'เพิ่มกิจกรรม' : 'แก้ไขกิจกรรม';
    
    // Load Plans and Projects for dropdowns
    await loadPlansDropdown();
    await loadProjectsDropdown();
    
    if (mode === 'edit' && id) {
        await loadActivityData(id);
    } else {
        document.getElementById('activityForm').reset();
    }
    
    document.getElementById('activityModal').style.display = 'block';
}

// Close Activity Modal
function closeActivityModal() {
    document.getElementById('activityModal').style.display = 'none';
    document.getElementById('activityForm').reset();
    currentActivityId = null;
}

// Load Plans Dropdown
async function loadPlansDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/master_plans`);
        const result = await response.json();
        
        if (result.status === 'success') {
            let options = '<option value="">-- เลือกแผนงาน --</option>';
            result.data.forEach(plan => {
                options += `<option value="${plan.id}">${plan.name}</option>`;
            });
            document.getElementById('planId').innerHTML = options;
        }
    } catch (error) {
        console.error('Error loading plans dropdown:', error);
    }
}

// Load Projects Dropdown
async function loadProjectsDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/master_projects`);
        const result = await response.json();
        
        if (result.status === 'success') {
            let options = '<option value="">-- เลือกโครงการ --</option>';
            result.data.forEach(project => {
                options += `<option value="${project.id}">${project.name}</option>`;
            });
            document.getElementById('projectId').innerHTML = options;
        }
    } catch (error) {
        console.error('Error loading projects dropdown:', error);
    }
}

// Load Activity Data for Edit
async function loadActivityData(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/project_activities/${id}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            const act = result.data;
            document.getElementById('activityName').value = act.activity_name || '';
            document.getElementById('fiscalYear').value = act.fiscal_year || '';
            document.getElementById('kindOfFiscal').value = act.kind_of_fiscal || '';
            document.getElementById('activity').value = act.activity || '';
            document.getElementById('expenses').value = act.expenses || '';
            document.getElementById('subActivityName').value = act.sub_activity_name || '';
            document.getElementById('planId').value = act.plan_id || '';
            document.getElementById('projectId').value = act.project_id || '';
            document.getElementById('targetGoal').value = act.target_goal || '';
        }
    } catch (error) {
        console.error('Error loading activity data:', error);
    }
}

// Activity Form Submit
document.getElementById('activityForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        activity_name: document.getElementById('activityName').value,
        fiscal_year: document.getElementById('fiscalYear').value,
        kind_of_fiscal: document.getElementById('kindOfFiscal').value,
        activity: document.getElementById('activity').value,
        expenses: document.getElementById('expenses').value,
        sub_activity_name: document.getElementById('subActivityName').value,
        plan_id: parseInt(document.getElementById('planId').value),
        project_id: parseInt(document.getElementById('projectId').value),
        target_goal: document.getElementById('targetGoal').value
    };
    
    try {
        let url = `${API_BASE_URL}/project_activities`;
        let method = 'POST';
        
        if (currentActivityId) {
            url = `${API_BASE_URL}/project_activities/${currentActivityId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            closeActivityModal();
            loadActivities();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error saving activity:', error);
        alert('เกิดข้อผิดพลาด');
    }
});

// Delete Activity
async function deleteActivity(id) {
    if (!confirm('คุณต้องการลบกิจกรรมนี้ใช่หรือไม่?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/project_activities/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ลบสำเร็จ');
            loadActivities();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting activity:', error);
    }
}

// ========================================
// Initialize
// ========================================
window.addEventListener('DOMContentLoaded', () => {
    showTab('plans'); // แสดงแท็บแรกเริ่มต้น
});