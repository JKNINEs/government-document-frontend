const API_BASE_URL = 'http://27.254.144.167/api/v1';

let currentDate = new Date();
let allEvents   = [];
let allRooms    = [];

// ========================================
// INIT
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    
    loadEvents();
    setupCalendarNav();
    setupModal();
    setupBookingForm();
});

// ========================================
// LOAD DATA
// ========================================


async function loadEvents() {
    try {
        const res    = await fetch(`${API_BASE_URL}/events`);
        const result = await res.json();
        allEvents    = result.data || [];
        renderCalendar();
         renderRoomStatus();
    } catch (err) {
        console.error('loadEvents:', err);
    }
}


function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

function requireLogin() {
    if (!isLoggedIn()) {
        alert('⚠️ กรุณาเข้าสู่ระบบก่อนดำเนินการ');
        window.location.replace('login.html');
        return false;
    }
    return true;
}

// ========================================
// RENDER CALENDAR
// ========================================
function renderCalendar() {
    const year  = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Header
    const monthNames = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                        'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    document.getElementById('monthYear').textContent = `${monthNames[month]} ${year + 543}`;

    const grid      = document.querySelector('.calendar-grid');
    const dayNames  = grid.querySelectorAll('.day-name');

    // ลบ day cells เก่าออก (คงแค่ day-name)
    grid.querySelectorAll('.day-cell').forEach(el => el.remove());

    const firstDay  = new Date(year, month, 1).getDay(); // 0=อา
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today     = new Date();

    // วันจากเดือนก่อน
    const prevDays  = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        const cell = createDayCell(prevDays - i, true, null);
        grid.appendChild(cell);
    }

    // วันของเดือนนี้
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr  = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isToday  = (d === today.getDate() && month === today.getMonth() && year === today.getFullYear());
        const dayEvents = allEvents.filter(e => e.start_datetime && e.start_datetime.startsWith(dateStr));
        const cell     = createDayCell(d, false, dateStr, isToday, dayEvents);
        grid.appendChild(cell);
    }

    // วันจากเดือนถัดไป
    const totalCells = firstDay + daysInMonth;
    const remaining  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
        const cell = createDayCell(i, true, null);
        grid.appendChild(cell);
    }

    renderRoomStatus();
}

function createDayCell(day, isOther, dateStr, isToday = false, events = []) {
    const cell = document.createElement('div');
    cell.className = 'day-cell' + (isOther ? ' other-month' : '') + (isToday ? ' today' : '');
    if (dateStr) cell.dataset.date = dateStr;

    const numDiv = document.createElement('div');
    numDiv.className = 'day-number';
    numDiv.textContent = day;
    cell.appendChild(numDiv);

    // แสดง event chip (max 2)
    const show = events.slice(0, 2);
    show.forEach(ev => {
        const chip = document.createElement('div');
        chip.className = 'event-chip';
        chip.style.background = getStatusColor(ev.status);
        chip.textContent = ev.title || '(ไม่มีชื่อ)';
        chip.addEventListener('click', (e) => {
            e.stopPropagation();
            openDetailModal(ev);
        });
        cell.appendChild(chip);
    });

    if (events.length > 2) {
        const more = document.createElement('div');
        more.className = 'more-chip';
        more.textContent = `+${events.length - 2} อื่นๆ`;
        more.addEventListener('click', (e) => { e.stopPropagation(); openDateModal(dateStr, events); });
        cell.appendChild(more);
    }

    // คลิกวันเพื่อจอง
    if (!isOther) {
        cell.addEventListener('click', () => openDateModal(dateStr, events));
    }

    return cell;
}

// ========================================
// ROOM STATUS (sidebar / right column)
// ========================================
function renderRoomStatus(selectedDate = null) {
    const container = document.getElementById('roomStatusList');
    if (!container) return;
    container.innerHTML = '';

    const roomNames = [...new Set(allEvents.map(ev => ev.room_name).filter(Boolean))].sort();

    if (roomNames.length === 0) {
        container.innerHTML = '<p style="color:#999;font-size:13px;padding:8px 0;">ไม่มีข้อมูลห้อง</p>';
        return;
    }

    roomNames.forEach(roomName => {
        // ดึง events ทั้งหมดของห้องนี้ที่ไม่ได้ยกเลิก เรียงตามวันเริ่ม
        const roomEvents = allEvents
            .filter(ev => ev.room_name === roomName && ev.status !== 'CANCELLED')
            .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));

        // เช็คว่ามี event ที่กำลังดำเนินอยู่ตอนนี้ไหม
        const now = new Date();
        const hasActive = roomEvents.some(ev => {
            const start = new Date(ev.start_datetime.replace(' ', 'T'));
            const end   = new Date(ev.end_datetime.replace(' ', 'T'));
            return start <= now && end >= now;
        });

        const busy = roomEvents.length > 0;

        // สร้าง event list แสดงทุกการจอง
        const eventList = roomEvents.map(ev => {
            const start = new Date(ev.start_datetime.replace(' ', 'T'));
            const end   = new Date(ev.end_datetime.replace(' ', 'T'));
            const isActive = start <= now && end >= now;

            return `
            <div class="room-event-detail ${isActive ? 'active-event' : ''}">
                <div class="event-detail-title">
                    🔴 <strong>${ev.title || '-'}</strong>
                </div>
                <div class="event-detail-range">
                    <i class="fas fa-calendar-alt"></i>
                    ${formatDateShort(ev.start_datetime)} – ${formatDateShort(ev.end_datetime)}
                </div>
                <div class="event-detail-time">
                    <i class="fas fa-clock"></i>
                    ${formatTime(ev.start_datetime)} – ${formatTime(ev.end_datetime)} น.
                </div>
            </div>`;
        }).join('');

        const item = document.createElement('div');
        item.className = 'room-status-item';
        item.innerHTML = `
            <div class="room-status-row">
                <span class="room-dot" style="background:${hasActive ? '#ef4444' : busy ? '#f59e0b' : '#10b981'}"></span>
                <span class="room-name-text">${roomName}</span>
                <span class="room-badge ${hasActive ? 'busy' : busy ? 'booked' : 'free'}">
                    ${hasActive ? 'กำลังใช้งาน' : busy ? 'มีการจอง' : 'ว่าง'}
                </span>
            </div>
            ${busy ? `<div class="room-events-list">${eventList}</div>` : ''}
        `;
        container.appendChild(item);
    });
}

function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr.replace(' ', 'T'));
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ========================================
// MODAL — คลิกวันในปฏิทิน
// ========================================
function openDateModal(dateStr, events) {
    document.getElementById('modalDate').textContent = formatDateTH(dateStr);
    document.getElementById('bookingForm').style.display = 'none';

    // ✅ ซ่อนปุ่มจองถ้าไม่ได้ login
    const addBtn = document.getElementById('addBookingBtn');
    addBtn.style.display = isLoggedIn() ? 'inline-block' : 'none';
    addBtn.dataset.date = dateStr;

    renderRoomStatus(dateStr);

    const evContainer = document.getElementById('modalEvents');
    evContainer.innerHTML = '';

    if (events.length === 0) {
        evContainer.innerHTML = '<p style="color:#999; font-size:14px; margin:12px 0;">ไม่มีการจองในวันนี้</p>';
    } else {
        events.forEach(ev => {
            const div = document.createElement('div');
            div.className = 'modal-event-item';
            div.style.borderLeft = `4px solid ${getStatusColor(ev.status)}`;

            // ✅ แสดงปุ่มแก้ไข/ลบเฉพาะเมื่อ login เท่านั้น
            const actionButtons = isLoggedIn() ? `
                <div class="mev-actions">
                    <button class="btn-sm btn-edit" id="btnEdit_${ev.id}">
                        <i class="fas fa-edit"></i> แก้ไข
                    </button>
                    <button class="btn-sm btn-del" id="btnDel_${ev.id}">
                        <i class="fas fa-trash"></i> ลบ
                    </button>
                </div>` : '';

            div.innerHTML = `
                <div class="mev-title">${ev.title || '-'}</div>
                <div class="mev-meta">
                    <i class="fas fa-door-open"></i> ${ev.room_name || '-'}
                    &nbsp;·&nbsp;
                    <i class="fas fa-clock"></i> ${formatTime(ev.start_datetime)} – ${formatTime(ev.end_datetime)}
                </div>
                ${actionButtons}
            `;
            evContainer.appendChild(div);

            if (isLoggedIn()) {
                document.getElementById(`btnEdit_${ev.id}`).addEventListener('click', () => openEditModal(ev.id));
                document.getElementById(`btnDel_${ev.id}`).addEventListener('click', () => deleteEvent(ev.id));
            }
        });
    }

    document.getElementById('eventModal').classList.add('show');
}

function openDetailModal(ev) {
    document.getElementById('modalDate').textContent = ev.title || '(ไม่มีชื่อ)';
    document.getElementById('addBookingBtn').style.display = 'none';
    document.getElementById('bookingForm').style.display = 'none';

    const actionButtons = isLoggedIn() ? `
        <div class="mev-actions" style="margin-top:12px;">
            <button class="btn-sm btn-edit" id="btnEdit_${ev.id}">
                <i class="fas fa-edit"></i> แก้ไข
            </button>
            <button class="btn-sm btn-del" id="btnDel_${ev.id}">
                <i class="fas fa-trash"></i> ลบ
            </button>
        </div>` : '';

    document.getElementById('modalEvents').innerHTML = `
        <div class="detail-block" style="border-left:4px solid ${getStatusColor(ev.status)}">
            <div class="detail-row"><i class="fas fa-door-open"></i><span>${ev.room_name || '-'}</span></div>
            <div class="detail-row"><i class="fas fa-calendar"></i><span>${formatDateTimeTH(ev.start_datetime)} – ${formatTime(ev.end_datetime)}</span></div>
            <div class="detail-row"><i class="fas fa-tag"></i>
                <span class="status-badge-inline" style="background:${getStatusColor(ev.status)}">${ev.status}</span>
            </div>
            ${ev.note ? `<div class="detail-row"><i class="fas fa-sticky-note"></i><span>${ev.note}</span></div>` : ''}
            ${actionButtons}
        </div>
    `;

    if (isLoggedIn()) {
        document.getElementById(`btnEdit_${ev.id}`).addEventListener('click', () => openEditModal(ev.id));
        document.getElementById(`btnDel_${ev.id}`).addEventListener('click', () => deleteEvent(ev.id));
    }

    document.getElementById('eventModal').classList.add('show');
}

// ========================================
// BOOKING FORM — สร้างใหม่
// ========================================
function setupBookingForm() {
    document.getElementById('addBookingBtn').addEventListener('click', () => {
        const dateStr = document.getElementById('addBookingBtn').dataset.date;
        renderBookingForm(dateStr, null);
    });
}

function renderBookingForm(dateStr, editData) {
    document.getElementById('addBookingBtn').style.display = 'none';
    const form = document.getElementById('bookingForm');
    form.style.display = 'block';

    const statusOptions = ['จองการใช้ห้อง'].map(s =>
        `<option value="${s}" ${editData?.status === s ? 'selected' : ''}>${s}</option>`
    ).join('');

    const startDT = editData ? editData.start_datetime?.slice(0, 16) : `${dateStr}T09:00`;
    const endDT   = editData ? editData.end_datetime?.slice(0, 16)   : `${dateStr}T12:00`;

    // ✅ ใช้ room_name โดยตรง ไม่ต้องพึ่ง allRooms
    const roomValue = editData?.room_name || '';

    form.innerHTML = `
        <div class="form-group">
            <label>ชื่อกิจกรรม *</label>
            <input type="text" id="f_title" value="${editData?.title || ''}" placeholder="ชื่อกิจกรรม" required>
        </div>
        <div class="form-group">
            <label>ห้อง *</label>
            <input type="text" id="f_room" placeholder="พิมพ์ชื่อห้อง" value="${roomValue}">
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>วันที่เริ่ม *</label>
                <input type="date" id="f_start_date" value="${startDT.slice(0,10)}">
            </div>
            <div class="form-group">
                <label>เวลาเริ่ม *</label>
                <select id="f_start_time">
                    ${generateTimeOptions(startDT.slice(11,16))}
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>วันที่สิ้นสุด *</label>
                <input type="date" id="f_end_date" value="${endDT.slice(0,10)}">
            </div>
            <div class="form-group">
                <label>เวลาสิ้นสุด *</label>
                <select id="f_end_time">
                    ${generateTimeOptions(endDT.slice(11,16))}
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>สถานะ</label>
            <select id="f_status">${statusOptions}</select>
        </div>
        <div class="form-group">
            <label>หมายเหตุ</label>
            <textarea id="f_note" rows="2" placeholder="หมายเหตุ (ถ้ามี)">${editData?.note || ''}</textarea>
        </div>
        <div class="form-actions-row">
            <button class="btn-sm btn-cancel-form" onclick="cancelForm()">ยกเลิก</button>
            <button class="btn-sm btn-save-form" onclick="saveEvent(${editData?.id || 'null'})">
                <i class="fas fa-save"></i> บันทึก
            </button>
        </div>
    `;
}

function cancelForm() {
    document.getElementById('bookingForm').style.display = 'none';
    document.getElementById('addBookingBtn').style.display = 'inline-block';
}

// ✅ สร้าง options เวลา ทุก 30 นาที
function generateTimeOptions(selectedTime = '09:00') {
    let options = '';
    for (let h = 0; h < 24; h++) {
        for (let m of ['00', '15', '30', '45']) {
            const val   = `${String(h).padStart(2,'0')}:${m}`;
            const label = `${String(h).padStart(2,'0')}:${m} น.`;
            options += `<option value="${val}" ${val === selectedTime ? 'selected' : ''}>${label}</option>`;
        }
    }
    return options;
}

// ========================================
// CRUD
// ========================================
async function saveEvent(id) {
    if (!requireLogin()) return; 
    const title     = document.getElementById('f_title').value.trim();
    const room_name = document.getElementById('f_room').value.trim();  // ✅ ใช้ตรงๆ
    const start = `${document.getElementById('f_start_date').value} ${document.getElementById('f_start_time').value}:00`;
    const end   = `${document.getElementById('f_end_date').value} ${document.getElementById('f_end_time').value}:00`;
    const status    = document.getElementById('f_status').value;
    const note      = document.getElementById('f_note').value.trim();

    if (!title || !room_name || !start || !end) { 
        alert('กรุณากรอกข้อมูลให้ครบ'); 
        return; 
    }
    if (start >= end) { alert('เวลาสิ้นสุดต้องหลังเวลาเริ่ม'); return; }

    const data = {
        title,
        room_name,                                    // ✅ ส่ง room_name
        start_datetime: start.replace('T', ' '),
        end_datetime:   end.replace('T', ' '),
        status,
        note: note || null,
        created_by: null
    };

    try {
        const url    = id ? `${API_BASE_URL}/events/${id}` : `${API_BASE_URL}/events`;
        const method = id ? 'PUT' : 'POST';
        const res    = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.status === 'success') {
            closeModal();
            await loadEvents();
            showToast(id ? '✅ แก้ไขการจองสำเร็จ' : '✅ จองห้องสำเร็จ');
        } else {
            alert('❌ ' + result.message);
        }
    } catch (err) {
        alert('❌ เกิดข้อผิดพลาด: ' + err.message);
    }
}

async function openEditModal(id) {
    const ev = allEvents.find(e => e.id == id);
    if (!ev) return;
    document.getElementById('modalDate').textContent = 'แก้ไขการจอง';
    document.getElementById('addBookingBtn').style.display = 'none';
    document.getElementById('modalEvents').innerHTML = '';
    renderBookingForm(ev.start_datetime?.slice(0, 10), ev);
    document.getElementById('eventModal').classList.add('show');
}

async function deleteEvent(id) {
    if (!requireLogin()) return;
    // ❌ ลบบรรทัด if (!confirm(...)) ออก
    try {
        const res    = await fetch(`${API_BASE_URL}/events/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.status === 'success') {
            closeModal();
            await loadEvents();
            showToast('✅ ลบการจองสำเร็จ');
        } else {
            alert('❌ ' + result.message);
        }
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

// ========================================
// MODAL CONTROL
// ========================================
function setupModal() {
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('eventModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

function openCreateModal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('modalDate').textContent = 'จองห้องใหม่';
    document.getElementById('addBookingBtn').style.display = 'none';
    document.getElementById('modalEvents').innerHTML = '';
    renderBookingForm(today, null);
    document.getElementById('eventModal').classList.add('show');
}

function closeModal() {
    document.getElementById('eventModal').classList.remove('show');
    document.getElementById('bookingForm').style.display = 'none';
    document.getElementById('bookingForm').innerHTML = '';
    document.getElementById('addBookingBtn').style.display = 'inline-block';
    document.getElementById('modalEvents').innerHTML = '';

    renderRoomStatus();
}

// ========================================
// CALENDAR NAV
// ========================================
function setupCalendarNav() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
}

// ========================================
// HELPERS
// ========================================
function getStatusColor(status) {
    const map = {
        'CONFIRMED': '#10b981',
        'TENTATIVE': '#f59e0b',
        'INQUIRY':   '#3b82f6',
        'CANCELLED': '#ef4444'
    };
    return map[status] || '#999';
}

function getRoomName(roomId) {
    return ev.room_name || '-';
}

function formatDateTH(dateStr) {
    if (!dateStr) return '';
    const normalized = dateStr.replace(' ', 'T');
    const d = new Date(normalized);
    return d.toLocaleDateString('th-TH', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
}

function formatDateTimeTH(dateStr) {
    if (!dateStr) return '';
    const normalized = dateStr.replace(' ', 'T');
    const d = new Date(normalized);
    return d.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }) 
           + ' ' + formatTime(dateStr);
}

function formatTime(dateStr) {
    if (!dateStr) return '';
    // รองรับทั้ง "2026-02-18 09:00:00" และ "2026-02-18T09:00"
    const normalized = dateStr.replace(' ', 'T');
    const d = new Date(normalized);
    if (isNaN(d)) return dateStr.slice(11, 16) || ''; // fallback ตัด string ตรงๆ
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast-msg';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}